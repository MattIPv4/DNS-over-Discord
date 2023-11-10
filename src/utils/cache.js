const sha512 = key => crypto.subtle.digest('SHA-512', new TextEncoder().encode(key))
    .then(buffer => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join(''));

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

export default async (func, args, kv, key, ttl, hash = true) => {
    // Get the hashed key if needed
    const hashedKey = hash ? await sha512(key) : key;

    // Check KV for cache
    const kvValue = await kv.getWithMetadata(hashedKey);
    if (kvValue?.value && kvValue?.metadata?.exp > Date.now()) return JSON.parse(kvValue.value, jsonDateParse);

    // Run the lookup and store in KV
    const res = await func(...args);
    await kv.put(hashedKey, JSON.stringify(res, jsonDateStringify), {
        metadata: { exp: Date.now() + ttl * 1000 },
        expirationTtl: Math.max(ttl, 60),
    });
    return res;
};
