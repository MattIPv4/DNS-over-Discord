import { Buffer } from 'buffer';
import { decode, encode, RECURSION_DESIRED, CHECKING_DISABLED } from 'dns-packet';
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

/**
 * @typedef {Object} LookupFlags
 * @property {boolean} [cd]
 */

/**
 * @template {string} T
 * @template {Object} U
 * @typedef {function} LookupMethod
 * @param {string} domain
 * @param {string} type
 * @param {import('./providers.js').ProviderEndpoint} endpoint
 * @param {T} endpoint.type
 * @param {LookupFlags} flags
 * @return {Promise<U>}
 */

/**
 * @typedef {{ name: string, type: number, data: string } & ({ TTL: number }|{ ttl: number})} LookupResultAnswer
 */

/**
 * @typedef {Object} LookupResultData
 * @property {number} Status
 * @property {{ name: string, type: number }[]} Question
 * @property {LookupResultAnswer[]} [Answer]
 * @property {LookupFlags} Flags
 */

/**
 * Perform a DNS lookup for a JSON DoH provider.
 *
 * @type LookupMethod<'json', LookupResultData>
 */
const performLookupJson = async (domain, type, endpoint, flags) => {
    // Build the query URL
    const query = new URL(endpoint.endpoint);
    query.searchParams.set('name', domain);
    query.searchParams.set('type', type.toLowerCase());

    // TODO: We should be able to set this to false safely, Cloudflare has a bug
    if (flags.cd) query.searchParams.set('cd', (!!flags.cd).toString().toLowerCase());

    // Make our request
    return fetch(query.href, {
        headers: {
            Accept: 'application/dns-json',
        },
    })
        .then(res => res.json())
        .then(data => ({
            Status: data.Status,
            Question: data.Question,
            Answer: data.Answer,
            Flags: { cd: !!data.CD },
        }));
};

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Perform a DNS lookup for a DNS DoH provider.
 *
 * @type LookupMethod<'dns', LookupResultData>
 */
const performLookupDns = async (domain, type, endpoint, flags) => {
    // Build the query packet
    const packet = encode({
        type: 'query',
        id: randInt(1, 65534),
        flags: RECURSION_DESIRED | (flags.cd ? CHECKING_DISABLED : 0),
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
        .then(res => res.arrayBuffer())
        .then(buffer => decode(Buffer.from(buffer)))
        .then(data => ({
            Status: toRcode(data.rcode),
            Question: data.questions,
            Answer: data.answers,
            Flags: { cd: data.flag_cd },
        }));
};

/**
 * Perform a DNS lookup for a DoH provider.
 *
 * @type LookupMethod<'json'|'dns', LookupResultData>
 */
const performLookupRequest = async (domain, type, endpoint, flags) => {
    switch (endpoint.type) {
        case 'json':
            return performLookupJson(domain, type, endpoint, flags);
        case 'dns':
            return performLookupDns(domain, type, endpoint, flags);
        default:
            return Promise.reject(
                new Error(`Unknown endpoint type: ${endpoint.type}`),
            );
    }
};

/**
 * Process data for a DNS answer, handling hex rdata.
 *
 * @param {string} type
 * @param {string} data
 * @return {string}
 */
const processData = (type, data) => {
    // Handle hex rdata
    if (data.startsWith('\\#')) {
        const words = data.split(' ');
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
            return `${flags} ${tag} "${value}"`;
        }

        // Normal hex data
        return words.map(part => String.fromCharCode(parseInt(part, 16))).join('').trim();
    }

    return data;
};

/**
 * @typedef {{ name: string, type: number, ttl: number, data: string }} LookupAnswer
 */

/**
 * @typedef {{ name: string, flags: LookupFlags } & ({ message: string }|{ answer: LookupAnswer[] })} LookupResult
 */

/**
 * Process answers for a DNS lookup.
 *
 * @param {string} type
 * @param {LookupResultAnswer[]} [answer]
 * @return {LookupAnswer[]|undefined}
 */
const processAnswer = (type, answer) => {
    if (!Array.isArray(answer)) return answer; // TODO: What do we actually have that's not an array?

    return answer.map(raw => ({
        name: raw.name,
        type: raw.type,
        ttl: raw.TTL ?? raw.ttl,
        data: processData(type, raw.data),
    }));
};

/**
 * Perform a DNS lookup for a DoH provider.
 *
 * @type LookupMethod<'json'|'dns', LookupResult>
 */
const performLookup = async (domain, type, endpoint, flags) => {
    // Make the request
    const { Status, Question, Answer, Flags } = await performLookupRequest(domain, type, endpoint, flags);

    // Return an error message for non-zero status
    if (Status !== 0)
        return {
            name: Question[0].name,
            flags: Flags,
            message: DNS_RCODES[Status] || `An unexpected error occurred [${Status}]`,
        };

    // Valid answer
    return {
        name: Question[0].name,
        flags: Flags,
        answer: processAnswer(type, Answer),
    };
};

/**
 * Perform a DNS lookup for a DoH provider, with caching.
 *
 * @type LookupMethod<'json'|'dns', LookupResult>
 */
export const performLookupWithCache = (domain, type, endpoint, flags) => cache(
    performLookup,
    [ domain, type, endpoint, flags ],
    `dns-${domain}-${type}-${endpoint.endpoint}-${!!flags.cd}`,
    Number(process.env.CACHE_DNS_TTL) || 10,
);

// Ordered by "popularity", dig command offers the first 25, multi-dig supports all
export const VALID_TYPES = Object.freeze([
    // Most common record types
    'A', 'AAAA', 'CAA', 'CERT', 'CNAME', 'MX', 'NS', 'SPF', 'SRV', 'TXT', 'DNSKEY', 'DS', 'LOC', 'URI', 'HTTPS',
    'NAPTR', 'PTR', 'SMIMEA', 'SOA', 'SSHFP', 'SVCB', 'TLSA', 'HINFO', 'CDS', 'CDNSKEY',
    // Other record types
    'AFSDB', 'APL', 'CSYNC', 'DHCID', 'DLV', 'DNAME', 'EUI48', 'EUI64', 'HIP', 'IPSECKEY',
    'KEY', 'KX', 'NSEC', 'NSEC3', 'NSEC3PARAM', 'OPENPGPKEY', 'RP', 'TA', 'TKEY', 'ZONEMD',
]);
