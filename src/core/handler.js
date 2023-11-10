import { InteractionType, InteractionResponseType, MessageFlags } from 'discord-api-types/payloads';

import verify from './verify.js';

/**
 * @typedef {Object} Command
 * @property {string} name
 * @property {string} description
 * @property {function} execute TODO: type
 */

/**
 * @typedef {Object} Component
 * @property {string} name
 * @property {function} execute TODO: type
 */

/**
 * @typedef {Object} Event
 * @property {*} request TODO: type
 * @property {*} env TODO: type
 * @property {*} ctx TODO: type
 */

/**
 * Create a new JSON response
 *
 * @param {any} obj Value to return as JSON
 * @returns {Response}
 */
const jsonResponse = obj => new Response(JSON.stringify(obj), {
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Handle an incoming Discord command interaction request to the Worker
 *
 * @param {Event} event
 * @param {import('discord-api-types/payloads').APIApplicationCommandInteraction} interaction
 * @param {Record<string, Command>} commands
 * @param {*} [sentry] TODO: type
 * @returns {Promise<Response>}
 */
const handleCommandInteraction = async (event, interaction, commands, sentry) => {
    // If the command doesn't exist, return a 404
    if (!commands[interaction.data.name])
        return new Response(null, { status: 404 });

    // Sentry scope
    if (sentry) sentry.getScope().setTransactionName(`command: ${interaction.data.name}`);
    if (sentry) sentry.getScope().setTag('command', interaction.data.name);

    // Execute
    try {
        return commands[interaction.data.name].execute({ interaction, response: jsonResponse, event, wait: event.ctx.waitUntil.bind(event.ctx), sentry });
    } catch (err) {
        // Log any errors
        console.log(interaction);
        console.error(err);
        if (sentry) sentry.captureException(err);

        // Send an ephemeral message to the user
        return jsonResponse({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: 'An unexpected error occurred when executing the command.',
                flags: MessageFlags.Ephemeral,
            },
        });
    }
};

/**
 * Handle an incoming Discord component interaction request to the Worker
 *
 * @param {Event} event
 * @param {import('discord-api-types/payloads').APIMessageComponentInteraction} interaction
 * @param {Record<string, Component>} components
 * @param {*} [sentry] TODO: type
 * @returns {Promise<Response>}
 */
const handleComponentInteraction = async (event, interaction, components, sentry) => {
    // If the component doesn't exist, return a 404
    if (!components[interaction.data.custom_id])
        return new Response(null, { status: 404 });

    // Sentry scope
    if (sentry) sentry.getScope().setTransactionName(`component: ${interaction.data.custom_id}`);
    if (sentry) sentry.getScope().setTag('component', interaction.data.custom_id);

    // Execute
    try {
        return components[interaction.data.custom_id].execute({ interaction, response: jsonResponse, event, wait: event.ctx.waitUntil.bind(event.ctx), sentry });
    } catch (err) {
        // Log any errors
        console.log(interaction);
        console.error(err);
        if (sentry) sentry.captureException(err);

        // Send a 500
        return new Response(null, { status: 500 });
    }
};

/**
 * Handle an incoming Discord interaction request to the Worker
 *
 * @param {Event} event
 * @param {Record<string, Command>} commands
 * @param {Record<string, Component>} components
 * @param {*} [sentry] TODO: type
 * @returns {Promise<Response>}
 */
const handleInteraction = async (event, commands, components, sentry) => {
    // Get the body as text
    const body = await event.request.text();
    if (sentry) sentry.setRequestBody(body);

    // Verify a legitimate request
    if (!await verify(event.request, body))
        return new Response(null, { status: 401 });

    /**
     * JSON payload for the interaction request
     * @type {import('discord-api-types/payloads').APIInteraction}
     */
    const interaction = JSON.parse(body);
    if (sentry) sentry.setRequestBody(interaction);

    // Handle different interaction types
    switch (interaction.type) {
        // Handle a PING
        case InteractionType.Ping:
            return jsonResponse({
                type: InteractionResponseType.Pong,
            });

        // Handle a command
        case InteractionType.ApplicationCommand:
            return handleCommandInteraction(event, interaction, commands, sentry);

        // Handle a component
        case InteractionType.MessageComponent:
            return handleComponentInteraction(event, interaction, components, sentry);

        // Unknown
        default:
            return new Response(null, { status: 501 });
    }
};

/**
 * Handle an incoming request to the Worker
 *
 *   - POST /interactions
 *   - GET  /health
 *
 * @param {Event} event
 * @param {Record<string, Command>} commands
 * @param {Record<string, Component>} components
 * @param {*} [sentry] TODO: type
 * @returns {Promise<Response | undefined>}
 */
const handleRequest = async (event, commands, components, sentry) => {
    const url = new URL(event.request.url);

    if (event.request.method === 'POST' && url.pathname === '/interactions')
        return handleInteraction(event, commands, components, sentry);

    if (event.request.method === 'GET' && url.pathname === '/health')
        return new Response('OK', {
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                Expires: '0',
                'Surrogate-Control': 'no-store',
            },
        });
};

/**
 * Create a new Worker fetch handler for Discord interactions
 *
 * @param {Command[]} commands Commands to register
 * @param {Component[]} components Components to register
 * @returns {(event: Event, sentry: *) => Promise<Response | undefined>} TODO: type
 */
const createHandler = (commands, components) => {
    const cmds = commands.reduce((acc, cmd) => {
        // Validate the command
        if (typeof cmd !== 'object' || cmd === null)
            throw new Error('Command must be an object');
        if (typeof cmd.name !== 'string' || !cmd.name.length)
            throw new Error('Command must have a name');
        if (typeof cmd.description !== 'string' || !cmd.description.length)
            throw new Error('Command must have a description');
        if (typeof cmd.execute !== 'function')
            throw new Error('Command must have an execute function');

        // Check the command doesn't already exist
        if (acc[cmd.name])
            throw new Error(`Command ${cmd.name} already exists`);

        // Add the command
        return {
            ...acc,
            [cmd.name]: cmd,
        };
    }, {});

    const cmps = components.reduce((acc, cmp) => {
        // Validate the component
        if (typeof cmp !== 'object' || cmp === null)
            throw new Error('Component must be an object');
        if (typeof cmp.name !== 'string' || !cmp.name.length)
            throw new Error('Component must have a name');
        if (typeof cmp.execute !== 'function')
            throw new Error('Component must have an execute function');

        // Check the component doesn't already exist
        if (acc[cmp.name])
            throw new Error(`Component ${cmp.name} already exists`);

        // Add the component
        return {
            ...acc,
            [cmp.name]: cmp,
        };
    }, {});

    // Return the handler
    return (event, sentry) => handleRequest(event, cmds, cmps, sentry);
};

export default createHandler;
