import whois from 'web-whois';
import cache from './cache.js';

export const performLookupWithCache = query =>
    cache(whois, [ query, true ], `whois-${query}`, Number(process.env.CACHE_WHOIS_TTL) || 30);
