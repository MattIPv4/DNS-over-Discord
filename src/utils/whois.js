/* global CACHE */

const whois = require('web-whois');

module.exports.performLookupWithCache = async query => {
    // If no KV, no cache
    if (typeof CACHE === 'undefined') return whois(query, true);

    // Check KV for cache
    const kvKey = `whois-${query}`;
    const kvValue = await CACHE.getWithMetadata(kvKey, { type: 'json' });
    if (kvValue && kvValue.value && kvValue.metadata && kvValue.metadata.exp > Date.now()) kvValue.value;

    // Run the lookup and store in KV
    // KV cache is only valid for 30s, delete from KV after 60s
    const res = await whois(query, true);
    await CACHE.put(kvKey, JSON.stringify(res), { metadata: { exp: Date.now() + 30 * 1000 }, expirationTtl: 60 });
    return res;
};
