const whois = require('web-whois');
const cache = require('./cache');

module.exports.performLookupWithCache = query =>
    cache(whois, [ query, true ], `whois-${query}`, Number(process.env.CACHE_WHOIS_TTL) || 30);
