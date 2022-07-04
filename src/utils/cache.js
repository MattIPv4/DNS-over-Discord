/* global CACHE */

const jsonDateStringify = function (key, value) {
    // Wrap Date objects in a custom Date() string
    if (this[key] instanceof Date) return `Date(${this[key].toISOString()})`;
    return value;
};

const jsonDateParse = function (key, value) {
    // Unwrap Date objects in a custom Date() string
    if (typeof this[key] === 'string') {
        const match = this[key].match(/^Date\((.+)\)$/);
        const date = match?.[1] && new Date(match[1]);
        if (date) return date;
    }
    return value;
};

export default async (func, args, key, ttl) => {
    // If no KV, no cache
    if (typeof CACHE === 'undefined') return func(...args);

    // Check KV for cache
    const kvValue = await CACHE.getWithMetadata(key);
    if (kvValue?.value && kvValue?.metadata?.exp > Date.now()) return JSON.parse(kvValue.value, jsonDateParse);

    // Run the lookup and store in KV
    const res = await func(...args);
    await CACHE.put(key, JSON.stringify(res, jsonDateStringify), {
        metadata: { exp: Date.now() + ttl * 1000 },
        expirationTtl: Math.max(ttl, 60),
    });
    return res;
};
