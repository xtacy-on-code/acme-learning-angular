const redis = require('../config/redis');

const DEFAULT_TTL = 60;

async function getOrSet(key, fetchFn, ttl = DEFAULT_TTL) {
    try {
        const cached = await redis.get(key);
        if (cached) {
            console.log(`Cache hit: ${key}`);
            return JSON.parse(cached); // already in cache
        } 
        
        // not in cache
        console.log(`Cache miss: ${key}`);
        const freshData = await fetchFn();
        await redis.setEx(key, ttl, JSON.stringify(freshData)); // set key value as freshData till it invalidates in TTL
        return freshData;

    } catch (err) {
        console.error('Cache error, falling back to DB:', err);
        return fetchFn();
    }
}

async function invalidate(key) {
    try {
        await redis.del(key); // invalidate the key (delete it!)
        console.log(`Cache invalidated: ${key}`);
    } catch (err) {
        console.error('Cache invalidation error:', err);
    }
}

async function invalidatePattern(pattern) {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Invalidated ${keys.length} keys matching: ${pattern}`);
        }
    } catch (err) {
        console.error('Pattern invalidation error:', err);
    }
}

module.exports = { getOrSet, invalidate, invalidatePattern }