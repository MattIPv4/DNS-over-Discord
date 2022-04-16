import { InteractionType, InteractionResponseType, MessageFlags } from 'discord-api-types/payloads/v9';
import WorkersSentry from 'workers-sentry/worker';
import verify from './utils/verify';
import Privacy from './utils/privacy';
import commands from '../tmp/commands.json';

// Util to send a JSON response
const jsonResponse = obj => new Response(JSON.stringify(obj), {
    headers: {
        'Content-Type': 'application/json',
    },
});

// Util to send a perm redirect response
const redirectResponse = url => new Response(null, {
    status: 301,
    headers: {
        Location: url,
    },
});

// Process a Discord command interaction
const handleCommandInteraction = async ({ body, wait, sentry }) => {
    // Locate the command data
    const commandData = commands[body.data.id];
    if (!commandData)
        return new Response(null, { status: 404 });

    try {
        // Load in the command
        const { default: command } = await import(`./commands/${commandData.file}`);

        // Execute
        return await command.execute({ interaction: body, response: jsonResponse, wait, sentry });
    } catch (err) {
        // Catch & log any errors
        console.log(body);
        console.error(err);
        sentry.captureException(err);

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

// Process a Discord component interaction
const handleComponentInteraction = async ({ body, wait, sentry }) => {
    try {
        // Load in the component handler
        const { default: component } = await import(`./components/${body.data.custom_id}.js`);

        // Execute
        return await component.execute({ interaction: body, response: jsonResponse, wait, sentry });
    } catch (err) {
        // Handle a non-existent component
        if (err.code === 'MODULE_NOT_FOUND')
            return new Response(null, { status: 404 });

        // Catch & log any errors
        console.log(body);
        console.error(err);
        sentry.captureException(err);

        // Send a 500
        return new Response(null, { status: 500 });
    }
};

// Process a Discord interaction POST request
const handleInteraction = async ({ request, wait, sentry }) => {
    // Get the body as text
    const bodyText = await request.text();
    sentry.setRequestBody(bodyText);

    // Verify a legitimate request
    if (!await verify(request, bodyText))
        return new Response(null, { status: 401 });

    // Work with JSON body going forward
    const body = JSON.parse(bodyText);
    sentry.setRequestBody(body);

    // Handle different interaction types
    switch (body.type) {
        // Handle a PING
        case InteractionType.Ping:
            return jsonResponse({
                type: InteractionResponseType.Pong,
            });

        // Handle a command
        case InteractionType.ApplicationCommand:
            return handleCommandInteraction({ body, wait, sentry });

        // Handle a component
        case InteractionType.MessageComponent:
            return handleComponentInteraction({ body, wait, sentry });

        // Unknown
        default:
            return new Response(null, { status: 501 });
    }
};

// Process all requests to the worker
const handleRequest = async ({ request, wait, sentry }) => {
    const url = new URL(request.url);

    // Send interactions off to their own handler
    if (request.method === 'POST' && url.pathname === '/interactions')
        return await handleInteraction({ request, wait, sentry });

    // Otherwise, we only care for GET requests
    if (request.method !== 'GET')
        return new Response(null, { status: 404 });

    // Health check route
    if (url.pathname === '/health')
        return new Response('OK', {
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                Expires: '0',
                'Surrogate-Control': 'no-store',
            },
        });

    // Privacy notice route
    if (url.pathname === '/privacy')
        return new Response(Privacy, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });

    // Invite redirect
    if (url.pathname === '/invite')
        return redirectResponse(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`);

    // Discord redirect
    if (url.pathname === '/server')
        return redirectResponse('https://discord.gg/JgxVfGn');

    // GitHub redirect
    if (url.pathname === '/github')
        return redirectResponse('https://github.com/MattIPv4/DNS-over-Discord');

    // Docs redirect
    if (url.pathname === '/')
        return redirectResponse('https://developers.cloudflare.com/1.1.1.1/other-ways-to-use-1.1.1.1/dns-over-discord');

    // Not found
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event => {
    // Start Sentry
    const sentry = new WorkersSentry(event, process.env.SENTRY_DSN);

    // Process the event
    return event.respondWith(handleRequest({
        request: event.request,
        wait: event.waitUntil.bind(event),
        sentry,
    }).catch(err => {
        // Log & re-throw any errors
        console.error(err);
        sentry.captureException(err);
        throw err;
    }));
});

