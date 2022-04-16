/* global CACHE */

export default async (func, args, key, ttl) => {
    // If no KV, no cache
    if (typeof CACHE === 'undefined') return func(...args);

    // Check KV for cache
    const kvValue = await CACHE.getWithMetadata(key, { type: 'json' });
    if (kvValue && kvValue.value && kvValue.metadata && kvValue.metadata.exp > Date.now()) return kvValue.value;

    // Run the lookup and store in KV
    const res = await func(...args);
    await CACHE.put(key, JSON.stringify(res), {
        metadata: { exp: Date.now() + ttl * 1000 },
        expirationTtl: Math.max(ttl, 60),
    });
    return res;
};
