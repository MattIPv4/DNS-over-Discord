import { Buffer } from 'buffer';
import { decode, encode, RECURSION_DESIRED } from 'dns-packet';
import { toRcode } from 'dns-packet/rcodes.js';
import fetch from 'node-fetch';
import cache from './cache.js';

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
    if (Array.isArray(answer)) {
        for (const entry of answer) {
            // Consistent TTL prop
            if (Object.prototype.hasOwnProperty.call(entry, 'TTL')) {
                entry.ttl = entry.TTL;
                Reflect.deleteProperty(entry, 'TTL');
            }

            // Handle hex rdata
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
                    const tag = words
                        .splice(0, tagLength)
                        .map((part) => String.fromCharCode(parseInt(part, 16)))
                        .join('')
                        .trim()
                        .replace(/[^a-z0-9]/gi, '');

                    // Get the value
                    const value = words
                        .map((part) => String.fromCharCode(parseInt(part, 16)))
                        .join('')
                        .trim();

                    // Combine and output
                    entry.data = `${flags} ${tag} '${value}'`;
                    continue;
                }

                // Normal hex data
                entry.data = words
                    .map((part) => String.fromCharCode(parseInt(part, 16)))
                    .join('')
                    .trim();
            }
        }
    }

    return answer;
};

const performLookupJson = async (domain, type, endpoint, cdflag) => {
    // Build the query URL
    const query = new URL(endpoint.endpoint);
    query.searchParams.set('name', domain);
    query.searchParams.set('type', type.toLowerCase());
    query.searchParams.set('cd', cdflag);

    // Make our request
    return fetch(query.href, {
        headers: {
            Accept: 'application/dns-json',
        },
    }).then(res => res.json());
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const performLookupDns = async (domain, type, endpoint, cdflag) => {
    // Build the query packet
    const packet = encode({
        type: 'query',
        id: randInt(1, 65534),
        flags: RECURSION_DESIRED | (cdflag ? CHECKING_DISABLED : 0),
        questions: [ {
            name: domain,
            type,
        } ],
    });

    // Build the query URL
    const query = new URL(endpoint.endpoint);
    query.searchParams.set('dns', packet.toString('base64').replace(/=+$/, ''));

    // Make our request
    return fetch(query.href, {
        headers: {
            Accept: 'application/dns-message',
        },
    })
        .then((res) => res.arrayBuffer())
        .then(data => {
            const dec = decode(Buffer.from(data));
            return {
                Status: toRcode(dec.rcode),
                Question: dec.questions,
                Answer: dec.answers,
            };
        });
};

const performLookupRequest = async (domain, type, endpoint, cdflag) => {
    switch (endpoint.type) {
        case 'json':
            return performLookupJson(domain, type, endpoint, cdflag);
        case 'dns':
            return performLookupDns(domain, type, endpoint, cdflag);
        default:
            return Promise.reject(
                new Error(`Unknown endpoint type: ${endpoint.type}`)
            );
    }
};

const performLookup = async (domain, type, endpoint, cdflag) => {
    // Make the request
    const { Status, Question, Answer } = await performLookupRequest(domain, type, endpoint, cdflag);

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

export const performLookupWithCache = (domain, type, endpoint, cdflag) => cache(
    performLookup,
    [ domain, type, endpoint, cdflag ],
    `dns-${domain}-${type}-${endpoint.endpoint}`,
    Number(process.env.CACHE_DNS_TTL) || 10,
);

// Ordered by 'popularity', dig command offers the first 25, multi-dig supports all
export const VALID_TYPES = Object.freeze([
    // Most common record types
    'A', 'AAAA', 'CAA', 'CERT', 'CNAME', 'MX', 'NS', 'SPF', 'SRV', 'TXT', 'DNSKEY', 'DS', 'LOC', 'URI', 'HTTPS',
    'NAPTR', 'PTR', 'SMIMEA', 'SOA', 'SSHFP', 'SVCB', 'TLSA', 'HINFO', 'CDS', 'CDNSKEY',
    // Other record types
    'AFSDB', 'APL', 'CSYNC', 'DHCID', 'DLV', 'DNAME', 'EUI48', 'EUI64', 'HIP', 'IPSECKEY',
    'KEY', 'KX', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'OPENPGPKEY', 'RP', 'TA', 'TKEY', 'ZONEMD',
]);
