const { default: Toucan } = require('toucan-js');

// Thanks @cloudflare/worker-sentry for the base of this
module.exports.initSentry = (event, opts = {}) => {
    // Use Toucan to interact with Sentry
    const sentry = new Toucan({
        dsn: process.env.SENTRY_DSN,
        event: event,
        allowedHeaders: [
            'user-agent',
            'cf-challenge',
            'accept-encoding',
            'accept-language',
            'cf-ray',
            'content-length',
            'content-type',
            'x-real-ip',
            'host',
        ],
        allowedSearchParams: /(.*)/,
        rewriteFrames: {
            root: '/',
        },
        ...opts,
    });

    // Get the request
    const request = event.request;

    // Determine with Cloudflare colo the req went to
    const colo = request.cf && request.cf.colo ? request.cf.colo : 'UNKNOWN';
    sentry.setTag('colo', colo);

    // Define the user making the req based on IP + UA + colo
    const ipAddress = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent') || '';
    sentry.setUser({ ip: ipAddress, userAgent: userAgent, colo: colo });

    // Done, start using Sentry!
    return sentry;
};
