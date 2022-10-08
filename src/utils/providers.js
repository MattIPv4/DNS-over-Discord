/**
 * @typedef {Object} ProviderEndpoint
 * @property {string} endpoint
 * @property {'json'|'dns'} type
 */

/**
 * @typedef {Object} Provider
 * @property {string} name
 * @property {string} info
 * @property {ProviderEndpoint} doh
 * @property {string} dig
 */

/**
 * Supported DNS providers.
 *
 * name, doh & dig must all be unique for each provider.
 *
 * @type {Provider[]}
 */
export default Object.freeze([
    {
        name: '1.1.1.1 (Cloudflare)',
        info: 'https://developers.cloudflare.com/1.1.1.1/',
        doh: {
            endpoint: 'https://cloudflare-dns.com/dns-query',
            type: 'json',
        },
        dig: '1.1.1.1',
    },
    {
        name: '1.1.1.2 (Cloudflare Malware Blocking)',
        info: 'https://developers.cloudflare.com/1.1.1.1/setup/#1111-for-families',
        doh: {
            endpoint: 'https://1.1.1.2/dns-query',
            type: 'json',
        },
        dig: '1.1.1.2',
    },
    {
        name: '1.1.1.3 (Cloudflare Malware + Adult Content Blocking)',
        info: 'https://developers.cloudflare.com/1.1.1.1/setup/#1111-for-families',
        doh: {
            endpoint: 'https://1.1.1.3/dns-query',
            type: 'json',
        },
        dig: '1.1.1.3',
    },
    {
        name: '8.8.8.8 (Google)',
        info: 'https://developers.google.com/speed/public-dns',
        doh: {
            endpoint: 'https://dns.google/resolve',
            type: 'json',
        },
        dig: '8.8.8.8',
    },
    {
        name: '9.9.9.9 (Quad9)',
        info: 'https://www.quad9.net/',
        doh: {
            endpoint: 'https://dns.quad9.net/dns-query',
            type: 'dns',
        },
        dig: '9.9.9.9',
    },
]);
