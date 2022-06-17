// Supported DNS providers
// name, doh & dig must all be unique for each provider
export default Object.freeze([
    {
        name: '1.1.1.1 (Cloudflare)',
        doh: 'https://cloudflare-dns.com/dns-query',
        dig: '1.1.1.1',
    },
    {
        name: '1.1.1.2 (Cloudflare Malware Blocking)',
        doh: 'https://1.1.1.2/dns-query',
        dig: '1.1.1.2',
    },
    {
        name: '1.1.1.3 (Cloudflare Malware + Adult Content Blocking)',
        doh: 'https://1.1.1.3/dns-query',
        dig: '1.1.1.3',
    },
    {
        name: '8.8.8.8 (Google)',
        doh: 'https://dns.google/resolve',
        dig: '8.8.8.8',
    },
]);
