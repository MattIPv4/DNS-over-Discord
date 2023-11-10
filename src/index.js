import WorkersSentry from 'workers-sentry/worker.js';

import createHandler from './core/handler.js';

import commands from './commands/index.js';
import components from './components/index.js';

import { captureException } from './utils/error.js';
import Privacy from './utils/strings/privacy.js';
import Terms from './utils/strings/terms.js';

const handler = createHandler(commands, components);

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
const handleRequest = async (event, sentry) => {
    // Check if this is a Discord interaction (or a health check)
    const resp = await handler(event, sentry);
    if (resp) return resp;

    // Otherwise, process the request
    const url = new URL(event.request.url);

    // Privacy notice route
    if (event.request.method === 'GET' && url.pathname === '/privacy')
        return textResponse(Privacy);

    // Terms notice route
    if (event.request.method === 'GET' && url.pathname === '/terms')
        return textResponse(Terms);

    // Invite redirect
    if (event.request.method === 'GET' && url.pathname === '/invite')
        return redirectResponse(`https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=applications.commands`);

    // Discord redirect
    if (event.request.method === 'GET' && url.pathname === '/server')
        return redirectResponse('https://discord.gg/JgxVfGn');

    // GitHub redirect
    if (event.request.method === 'GET' && url.pathname === '/github')
        return redirectResponse('https://github.com/MattIPv4/DNS-over-Discord');

    // Docs redirect
    if (event.request.method === 'GET' && url.pathname === '/')
        return redirectResponse('https://developers.cloudflare.com/1.1.1.1/other-ways-to-use-1.1.1.1/dns-over-discord');

    // Not found
    return new Response(null, { status: 404 });
};

// Register the worker listener
addEventListener('fetch', event => {
    // Start Sentry
    const sentry = new WorkersSentry(event, process.env.SENTRY_DSN);

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
    return event.respondWith(
        handleRequest(event, sentry)
            .catch(err => {
                // Log any errors
                captureException(err, sentry);

                // Re-throw the error for Cf
                throw err;
            }),
    );
});
