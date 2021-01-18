const { fetch } = require('node-fetch');

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

module.exports.performLookup = async (domain, type) => {
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
    const { Status, Answer } = await res.json();

    // Return an error message for non-zero status
    if (Status !== 0) {
        return { message: DNS_RCODES[Status] || `An unexpected error occurred [${Status}]` };
    }

    // Valid answer
    return Answer;
};

module.exports.VALID_TYPES = Object.freeze([
    'A', 'AAAA', 'CAA', 'CERT', 'CNAME', 'DNSKEY', 'DS', 'LOC', 'MX', 'NAPTR',
    'NS', 'PTR', 'SMIMEA', 'SPF', 'SRV', 'SSHFP', 'TLSA', 'TXT', 'URI'
]);

module.exports.POPULAR_TYPES = Object.freeze(['A', 'AAAA', 'CAA', 'CERT', 'CNAME', 'MX', 'NS', 'SPF', 'SRV', 'TXT']);
