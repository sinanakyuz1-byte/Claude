const NodeCache = require('node-cache');

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '900', 10);

const cache = new NodeCache({ stdTTL: TTL, checkperiod: 120 });

module.exports = {
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl || TTL),
  del: (key) => cache.del(key),
  keys: () => cache.keys(),
};
