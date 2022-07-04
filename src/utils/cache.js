/* global CACHE */

const jsonDateStringify = (key, value) => {
    // Wrap Date objects in a custom Date() string
    if (value instanceof Date) return `Date(${value.toISOString()})`;

    // Process objects recursively
    if (typeof value === 'object') return Object.entries(value).reduce((acc, [ k, v ]) => ({
        ...acc,
        [k]: jsonDateStringify(k, v),
    }), {});

    return value;
};

const jsonDateParse = (key, value) => {
    // Unwrap Date objects in a custom Date() string
    if (typeof value === 'string') {
        const match = value.match(/^Date\((.+)\)$/);
        if (match) return new Date(match[1]);
    }
    return value;
};

export default async (func, args, key, ttl) => {
    // If no KV, no cache
    if (typeof CACHE === 'undefined') return func(...args);

    // Check KV for cache
    const kvValue = await CACHE.getWithMetadata(key);
    if (kvValue && kvValue.value && kvValue.metadata && kvValue.metadata.exp > Date.now()) {
        return JSON.parse(kvValue.value, jsonDateParse);
    }

    // Run the lookup and store in KV
    const res = await func(...args);
    await CACHE.put(key, JSON.stringify(res, jsonDateStringify), {
        metadata: { exp: Date.now() + ttl * 1000 },
        expirationTtl: Math.max(ttl, 60),
    });
    return res;
};
