import { InteractionType, InteractionResponseType, MessageFlags } from 'discord-api-types/payloads';

import verify, { importKey } from './verify.js';
import { validateCommands, validateComponents } from './util.js';

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
 * @param {Record<string, import('./util.js').Command>} commands
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
        return commands[interaction.data.name].execute({ interaction, response: jsonResponse, event, wait: event.ctx.waitUntil.bind(event.ctx), commands, sentry });
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
 * @param {Record<string, import('./util.js').Component>} components
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
 * @param {Promise<CryptoKey>} publicKey
 * @param {Record<string, import('./util.js').Command>} commands
 * @param {Record<string, import('./util.js').Component>} components
 * @param {*} [sentry] TODO: type
 * @returns {Promise<Response>}
 */
const handleInteraction = async (event, publicKey, commands, components, sentry) => {
    // Get the body as text
    const body = await event.request.text();
    if (sentry) sentry.setRequestBody(body);

    // Verify a legitimate request
    if (!await verify(event.request, body, await publicKey))
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
 * @param {Promise<CryptoKey>} publicKey
 * @param {Record<string, import('./util.js').Command>} commands
 * @param {Record<string, import('./util.js').Component>} components
 * @param {*} [sentry] TODO: type
 * @returns {Promise<Response | undefined>}
 */
const handleRequest = async (event, publicKey, commands, components, sentry) => {
    const url = new URL(event.request.url);

    if (event.request.method === 'POST' && url.pathname === '/interactions')
        return handleInteraction(event, publicKey, commands, components, sentry);

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
 * @param {import('./util.js').Command[]} commands Commands to register
 * @param {import('./util.js').Component[]} components Components to register
 * @param {string} publicKey Public key for verifying requests
 * @returns {(event: Event, sentry: *) => Promise<Response | undefined>} TODO: type
 */
const createHandler = async (commands, components, publicKey) => {
    // Validate the commands and components given
    const cmds = validateCommands(commands);
    const cmps = validateComponents(components);

    // Import the full key for verification
    const key = importKey(publicKey);

    // Return the handler
    return (event, sentry) => handleRequest(event, key, cmds, cmps, sentry);
};

export default createHandler;
