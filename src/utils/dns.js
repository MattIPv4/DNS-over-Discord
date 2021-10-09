/* global CACHE */

const DNS_RCODES = Object.freeze({
    0: 'No error',
    1: 'A format error [1 - FormErr] occurred when looking up the domain',
    2: 'An unexpected server failure [2 - ServFail] occurred when looking up the domain',
    3: 'A non-existent domain [3 - NXDomain] was requested and could not be found',
    4: 'A request was made that is not implemented [4 - NotImp] by the resolver',
    5: 'The query was refused [5 - Refused] by the DNS resolver',
    6: 'Name Exists when it should not',
    7: 'RR Set Exists when it should not',
    8: 'RR Set that should exist does not',
    9: 'Server Not Authoritative for zone or Not Authorized',
    10: 'Name not contained in zone',
    11: 'DSO-TYPE Not Implemented',
    16: 'Bad OPT Version or TSIG Signature Failure',
    17: 'Key not recognized',
    18: 'Signature out of time window',
    19: 'Bad TKEY Mode',
    20: 'Duplicate key name',
    21: 'Algorithm not supported',
    22: 'Bad Truncation',
    23: 'Bad/missing Server Cookie',
});

const processAnswer = (type, answer) => {
    // Handle hex rdata
    if (Array.isArray(answer)) {
        for (const entry of answer) {
            if (entry.data.startsWith('\\#')) {
                const words = entry.data.split(' ');
                const length = words.length > 1 ? Number(words[1]) : 0;

                // Drop the # and length, and any extra bytes beyond the declared length
                words.splice(0, 2);
                words.splice(length);

                // CAA
                if (type === 'CAA' && words.length > 1) {
                    const flags = Number(words[0]);
                    const tagLength = Number(words[1]);
                    words.splice(0, 2);

                    // Get the tag, dropping any non alpha-numeric bytes per
                    //  https://tools.ietf.org/html/rfc6844#section-5.1
                    const tag = words.splice(0, tagLength)
                        .map(part => String.fromCharCode(parseInt(part, 16))).join('').trim()
                        .replace(/[^a-z0-9]/gi, '');

                    // Get the value
                    const value = words.map(part => String.fromCharCode(parseInt(part, 16))).join('').trim();

                    // Combine and output
                    entry.data = `${flags} ${tag} "${value}"`;
                    continue;
                }

                // Normal hex data
                entry.data = words.map(part => String.fromCharCode(parseInt(part, 16))).join('').trim();
            }
        }
    }

    return answer;
};

const performLookup = async (domain, type) => {
    // Build the query URL
    const query = new URL('https://cloudflare-dns.com/dns-query');
    query.searchParams.set('name', domain);
    query.searchParams.set('type', type.toLowerCase());

    // Make our request to Cloudflare
    const res = await fetch(query.href, {
        headers: {
            Accept: 'application/dns-json',
        },
    });

    // Parse the response
    const { Status, Question, Answer } = await res.json();

    // Return an error message for non-zero status
    if (Status !== 0)
        return {
            name: Question[0].name,
            message: DNS_RCODES[Status] || `An unexpected error occurred [${Status}]`,
        };

    // Valid answer
    return {
        name: Question[0].name,
        answer: processAnswer(type, Answer),
    };
};

module.exports.performLookupWithCache = async (domain, type) => {
    // If no KV, no cache
    if (typeof CACHE === 'undefined') return performLookup(domain, type);

    // Check KV for cache
    const kvKey = `dns-${domain}-${type}`;
    const kvValue = await CACHE.getWithMetadata(kvKey, { type: 'json' });
    if (kvValue && kvValue.value && kvValue.metadata && kvValue.metadata.exp > Date.now()) kvValue.value;

    // Run the lookup and store in KV
    // KV cache is only valid for 10s, delete from KV after 60s
    const res = await performLookup(domain, type);
    await CACHE.put(kvKey, JSON.stringify(res), { metadata: { exp: Date.now() + 10 * 1000 }, expirationTtl: 60 });
    return res;
};

// Ordered by "popularity", dig command offers the first 25, multi-dig supports all
module.exports.VALID_TYPES = Object.freeze([
    // Most common record types
    'A', 'AAAA', 'CAA', 'CERT', 'CNAME', 'MX', 'NS', 'SPF', 'SRV', 'TXT', 'DNSKEY', 'DS', 'LOC', 'URI', 'HTTPS',
    'NAPTR', 'PTR', 'SMIMEA', 'SOA', 'SSHFP', 'SVCB', 'TLSA', 'HINFO', 'CDS', 'CDNSKEY',
    // Other record types
    'AFSDB', 'APL', 'CSYNC', 'DHCID', 'DLV', 'DNAME', 'EUI48', 'EUI64', 'HIP', 'IPSECKEY',
    'KEY', 'KX', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'OPENPGPKEY', 'RP', 'TA', 'TKEY', 'ZONEMD',
]);
