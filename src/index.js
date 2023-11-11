import WorkersSentry from 'workers-sentry/worker.js';
import { createHandler } from 'workers-discord';

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
const handleRequest = async (request, env, ctx, sentry) => {
    // Include the env in the context we pass to the handler
    ctx.env = env;

    // Check if this is a Discord interaction (or a health check)
    const resp = await handler(request, ctx, sentry);
    if (resp) return resp;

    // Otherwise, process the request
    const url = new URL(request.url);

    // Privacy notice route
    if (request.method === 'GET' && url.pathname === '/privacy')
        return textResponse(Privacy);

    // Terms notice route
    if (request.method === 'GET' && url.pathname === '/terms')
        return textResponse(Terms);

    // Invite redirect
    if (request.method === 'GET' && url.pathname === '/invite')
        return redirectResponse(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`);

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
export default {
    fetch: async (request, env, ctx) => {
        // Start Sentry
        const sentry = new WorkersSentry({
            type: 'fetch',
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
        }, process.env.SENTRY_DSN);

        // Monkey-patch transaction name support
        // TODO: Remove once https://github.com/robertcepa/toucan-js/issues/109 is resolved
        const scopeProto = Object.getPrototypeOf(sentry.getScope());
        scopeProto.setTransactionName = function (name) {
            this.adapter.setTransactionName(name);
        };
        const adapterProto = Object.getPrototypeOf(sentry.getScope().adapter);
        const apply = adapterProto.applyToEventSync;
        adapterProto.applyToEventSync = function (event) {
            const applied = apply.call(this, event);
            if (this._transactionName) applied.transaction = this._transactionName;
            return applied;
        };

        // Process the event
        return handleRequest(request, env, ctx, sentry)
            .catch(err => {
                // Log any errors
                captureException(err, sentry);

                // Re-throw the error for Cf
                throw err;
            });
    },
};
