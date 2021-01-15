const { InteractionType, InteractionResponseType, verifyKey } = require('discord-interactions');
const Privacy = require('./utils/privacy');
const commands = require('./build/data/commands.json');
const env = require('./build/data/environment.json');

const jsonResponse = obj => new Response(JSON.stringify(obj), {
    headers: {
        'Content-Type': 'application/json',
    },
});

const handleInteractionVerification = (request, bodyBuffer) => {
    const timestamp = request.headers.get('X-Signature-Timestamp') || '';
    const signature = request.headers.get('X-Signature-Ed25519') || '';

    return verifyKey(bodyBuffer, signature, timestamp, env.CLIENT_PUBLIC_KEY);
};

const handleInteraction = async ({ request, wait }) => {
    // Get the body as a buffer
    const bodyBuffer = await request.arrayBuffer();

    // Verification a legitimate request
    if (!handleInteractionVerification(request, bodyBuffer))
        return new Response(null, { status: 401 });

    // Work with JSON body going forward
    const body = JSON.parse((new TextDecoder('utf-8')).decode(bodyBuffer)) || {};

    // Handle a PING
    if (body.type === InteractionType.PING)
        return jsonResponse({
            type: InteractionResponseType.PONG,
        });

    // Otherwise, we only care for commands
    if (body.type !== InteractionType.COMMAND)
        return new Response(null, { status: 501 });

    // Locate the command data
    const commandData = commands[body.data.id];
    if (!commandData)
        return new Response(null, { status: 404 });

    try {
        // Load in the command
        const command = require(`./commands/${commandData.file}`);

        // Execute
        return await command.execute({ interaction: body, env, response: jsonResponse, wait });
    } catch (err) {
        // Catch & log any errors
        console.log(body);
        console.error(err);

        // Send an ephemeral message to the user
        return jsonResponse({
            type: InteractionResponseType.CHANNEL_MESSAGE,
            data: {
                content: 'An unexpected error occurred when executing the command.',
                flags: 1 << 6,
            },
        });
    }
};

const handleRequest = async ({ request, wait }) => {
    const url = new URL(request.url);

    // Send interactions off to their own handler
    if (request.method === 'POST' && url.pathname === '/interactions')
        return await handleInteraction({ request, wait });

    // Otherwise, we only care for GET requests
    if (request.method !== 'GET')
        return new Response(null, { status: 404 });

    // Health check route
    if (url.pathname === '/health')
        return new Response('OK', {
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Expires': '0',
                'Surrogate-Control': 'no-store',
            }
        });

    // Privacy notice route
    if (url.pathname === '/privacy')
        return new Response(Privacy, {
            headers: {
                'Content-Type': 'text/plain',
            }
        });

    // Invite redirect
    if (url.pathname === '/privacy')
        return new Response(null, {
            status: 301,
            headers: {
                'Location': `https://discord.com/oauth2/authorize?client_id=${env.CLIENT_ID}&scope=applications.commands`,
            }
        });

    // Discord redirect
    if (url.pathname === '/server')
        return new Response(null, {
            status: 301,
            headers: {
                'Location': 'https://discord.gg/JgxVfGn',
            }
        });

    // GitHub redirect
    if (url.pathname === '/github')
        return new Response(null, {
            status: 301,
            headers: {
                'Location': 'https://github.com/MattIPv4/DNS-over-Discord/',
            }
        });

    // Docs redirect
    if (url.pathname === '/')
        return new Response(null, {
            status: 301,
            headers: {
                'Location': 'https://developers.cloudflare.com/1.1.1.1/fun-stuff/dns-over-discord',
            }
        });

    // Not found
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event =>
    event.respondWith(handleRequest({ request: event.request, wait: event.waitUntil.bind(event) })));
