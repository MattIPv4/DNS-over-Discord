import * as Sentry from '@sentry/cloudflare';
import { createHandler } from 'workers-discord';
import { ApplicationIntegrationType } from 'discord-api-types/payloads';

import commands from './commands/index.js';
import components from './components/index.js';

import { captureException } from './utils/error.js';
import Privacy from './utils/strings/privacy.js';
import Terms from './utils/strings/terms.js';

const handler = createHandler(commands, components, process.env.CLIENT_PUBLIC_KEY);

// Util to send a plain-text response
const textResponse = text => new Response(text, {
    headers: {
        'Content-Type': 'text/plain',
    },
});

// Util to send a perm redirect response
const redirectResponse = url => new Response(null, {
    status: 301,
    headers: {
        Location: url,
    },
});

// Process all requests to the worker
const handleRequest = async (request, env, ctx) => {
    // Include the env in the context we pass to the handler
    ctx.env = env;

    // Check if this is a Discord interaction (or a health check)
    const resp = await handler(request, ctx);
    if (resp) return resp;

    // Otherwise, process the request
    const url = new URL(request.url);

    // Privacy notice route
    if (request.method === 'GET' && url.pathname === '/privacy')
        return textResponse(Privacy);

    // Terms notice route
    if (request.method === 'GET' && url.pathname === '/terms')
        return textResponse(Terms);

    // Invite redirects
    if (request.method === 'GET' && url.pathname === '/invite')
        return redirectResponse(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`);
    if (request.method === 'GET' && url.pathname === '/invite/user')
        return redirectResponse(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands&integration_type=${ApplicationIntegrationType.UserInstall}`);

    // Discord redirect
    if (request.method === 'GET' && url.pathname === '/server')
        return redirectResponse('https://discord.gg/JgxVfGn');

    // GitHub redirect
    if (request.method === 'GET' && url.pathname === '/github')
        return redirectResponse('https://github.com/MattIPv4/DNS-over-Discord');

    // Docs redirect
    if (request.method === 'GET' && url.pathname === '/')
        return redirectResponse('https://developers.cloudflare.com/1.1.1.1/other-ways-to-use-1.1.1.1/dns-over-discord');

    // Not found
    return new Response(null, { status: 404 });
};

// Register the Worker fetch handler
export default Sentry.withSentry(env => ({
    dsn: env.SENTRY_DSN,
    release: env.SENTRY_RELEASE,
    environment: env.SENTRY_ENVIRONMENT,
}), {
    fetch: async (request, env, ctx) => {
        Sentry.setTags({
            requestId: crypto.randomUUID(),
            userAgent: request.headers.get('user-agent'),
            ray: request.headers.get('cf-ray'),
            country: request.cf?.country,
            colo: request.cf?.colo,
        });

        Sentry.setUser({
            ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
            colo: request.cf?.colo,
        });

        return handleRequest(request, env, ctx);
    },
});
