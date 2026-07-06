import { env } from 'cloudflare:workers';
import whois from 'web-whois';
import cache from './cache.js';

export const performLookupWithCache = (query, kv) =>
    cache(whois, [ query, true ], kv, `whois-${query}`, Number(env.CACHE_WHOIS_TTL) || 30);
