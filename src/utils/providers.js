// Supported DNS providers
// name, doh & dig must all be unique for each provider
// doh.type can be 'json' or 'dns'
export default Object.freeze([
    {
        name: '1.1.1.1 (Cloudflare)',
        doh: {
            endpoint: 'https://cloudflare-dns.com/dns-query',
            type: 'json',
        },
        dig: '1.1.1.1',
    },
    {
        name: '1.1.1.2 (Cloudflare Malware Blocking)',
        doh: {
            endpoint: 'https://1.1.1.2/dns-query',
            type: 'json',
        },
        dig: '1.1.1.2',
    },
    {
        name: '1.1.1.3 (Cloudflare Malware + Adult Content Blocking)',
        doh: {
            endpoint: 'https://1.1.1.3/dns-query',
            type: 'json',
        },
        dig: '1.1.1.3',
    },
    {
        name: '8.8.8.8 (Google)',
        doh: {
            endpoint: 'https://dns.google/resolve',
            type: 'json',
        },
        dig: '8.8.8.8',
    },
    {
        name: '9.9.9.9 (Quad9)',
        doh: {
            endpoint: 'https://dns.quad9.net/dns-query',
            type: 'dns',
        },
        dig: '9.9.9.9',
    },
]);
