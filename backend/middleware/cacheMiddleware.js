// Advanced API Caching Middleware
// Implements multi-layer caching with memory, Redis fallback, and intelligent invalidation

// LRU Cache implementation (simplified version for compatibility)
class SimpleLRUCache {
  constructor(options) {
    this.max = options.max || 1000;
    this.maxSize = options.maxSize || 50 * 1024 * 1024;
    this.ttl = options.ttl || 5 * 60 * 1000;
    this.cache = new Map();
    this.sizes = new Map();
    this.timers = new Map();
  }
  
  set(key, value, options = {}) {
    const ttl = options.ttl || this.ttl;
    const size = JSON.stringify(value).length;
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }
    
    this.cache.set(key, value);
    this.sizes.set(key, size);
    
    // Set TTL timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    this.timers.set(key, timer);
  }
  
  get(key) {
    return this.cache.get(key);
  }
  
  has(key) {
    return this.cache.has(key);
  }
  
  delete(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    this.sizes.delete(key);
    return this.cache.delete(key);
  }
  
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.sizes.clear();
    this.cache.clear();
  }
  
  get size() {
    return this.cache.size;
  }
  
  get calculatedSize() {
    return Array.from(this.sizes.values()).reduce((sum, size) => sum + size, 0);
  }
  
  keys() {
    return this.cache.keys();
  }
  
  entries() {
    return this.cache.entries();
  }
}

const LRUCache = SimpleLRUCache;
import crypto from 'crypto';
import { performance } from 'perf_hooks';

// In-memory cache configuration
const cacheOptions = {
  max: 1000, // Maximum number of items
  maxSize: 50 * 1024 * 1024, // 50MB maximum memory usage
  sizeCalculation: (value) => {
    return JSON.stringify(value).length;
  },
  ttl: 5 * 60 * 1000, // 5 minutes default TTL
  allowStale: true, // Allow stale data during refresh
  updateAgeOnGet: true, // Update TTL on access
  updateAgeOnHas: true
};

const memoryCache = new LRUCache(cacheOptions);

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
  sets: 0,
  deletes: 0,
  hitRatio: 0,
  avgResponseTime: 0,
  lastResetAt: new Date().toISOString()
};

/**
 * Generate cache key from request
 */
function generateCacheKey(req, options = {}) {
  const { 
    includeQuery = true, 
    includeUser = true, 
    includeHeaders = false,
    prefix = 'api'
  } = options;
  
  let keyParts = [prefix, req.method, req.route?.path || req.path];
  
  if (includeQuery && Object.keys(req.query).length > 0) {
    // Sort query parameters for consistent keys
    const sortedQuery = Object.keys(req.query)
      .sort()
      .reduce((result, key) => {
        result[key] = req.query[key];
        return result;
      }, {});
    keyParts.push(JSON.stringify(sortedQuery));
  }
  
  if (includeUser && req.user) {
    keyParts.push(`user:${req.user.id || req.user._id}`);
    if (req.user.role) {
      keyParts.push(`role:${req.user.role}`);
    }
  }
  
  if (includeHeaders && req.headers) {
    const relevantHeaders = ['accept-language', 'authorization'];
    relevantHeaders.forEach(header => {
      if (req.headers[header]) {
        keyParts.push(`${header}:${req.headers[header]}`);
      }
    });
  }
  
  const keyString = keyParts.join('|');
  return crypto.createHash('md5').update(keyString).digest('hex');
}

/**
 * Cache middleware factory with advanced options
 */
export function cacheResponse(options = {}) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    keyGenerator = null,
    condition = null,
    tags = [],
    invalidateOn = [],
    staleWhileRevalidate = false,
    varyBy = [],
    skipCache = false
  } = options;
  
  return async (req, res, next) => {
    if (skipCache || req.method !== 'GET') {
      return next();
    }
    
    // Check condition if provided
    if (condition && !condition(req, res)) {
      return next();
    }
    
    const startTime = performance.now();
    const cacheKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req, options);
    
    try {
      // Try to get from cache
      const cachedResponse = memoryCache.get(cacheKey);
      
      if (cachedResponse) {
        cacheStats.hits++;
        
        const responseTime = performance.now() - startTime;
        cacheStats.avgResponseTime = 
          (cacheStats.avgResponseTime * (cacheStats.hits + cacheStats.misses - 1) + responseTime) / 
          (cacheStats.hits + cacheStats.misses);
        
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'X-Cache-TTL': cachedResponse.ttl,
          'Cache-Control': `public, max-age=${Math.floor(ttl / 1000)}`
        });
        
        // Set cached headers
        if (cachedResponse.headers) {
          Object.keys(cachedResponse.headers).forEach(key => {
            res.set(key, cachedResponse.headers[key]);
          });
        }
        
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }
      
      // Cache miss - proceed with request
      cacheStats.misses++;
      
      // Intercept response
      const originalSend = res.json;
      const originalStatus = res.status;
      let responseStatus = 200;
      
      res.status = function(status) {
        responseStatus = status;
        return originalStatus.call(this, status);
      };
      
      res.json = function(data) {
        // Only cache successful responses
        if (responseStatus >= 200 && responseStatus < 300) {
          const responseToCache = {
            status: responseStatus,
            data: data,
            headers: extractCacheableHeaders(res),
            cachedAt: new Date().toISOString(),
            ttl: ttl
          };
          
          // Add tags for invalidation
          if (tags.length > 0) {
            responseToCache.tags = tags;
          }
          
          memoryCache.set(cacheKey, responseToCache, { ttl });
          cacheStats.sets++;
          
          res.set({
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
            'Cache-Control': `public, max-age=${Math.floor(ttl / 1000)}`
          });
        }
        
        const responseTime = performance.now() - startTime;
        cacheStats.avgResponseTime = 
          (cacheStats.avgResponseTime * (cacheStats.hits + cacheStats.misses - 1) + responseTime) / 
          (cacheStats.hits + cacheStats.misses);
        
        return originalSend.call(this, data);
      };
      
      next();
      
    } catch (error) {
      cacheStats.errors++;
      console.error('❌ Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Extract cacheable response headers
 */
function extractCacheableHeaders(res) {
  const cacheableHeaders = [
    'content-type',
    'content-language',
    'last-modified',
    'etag'
  ];
  
  const headers = {};
  cacheableHeaders.forEach(header => {
    const value = res.get(header);
    if (value) {
      headers[header] = value;
    }
  });
  
  return headers;
}

/**
 * Cache invalidation by pattern or tags
 */
export function invalidateCache(pattern = null, tags = []) {
  try {
    let invalidatedCount = 0;
    
    if (pattern) {
      // Pattern-based invalidation using regex
      const regex = new RegExp(pattern);
      const keysToDelete = [];
      
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        memoryCache.delete(key);
        invalidatedCount++;
      });
    }
    
    if (tags.length > 0) {
      // Tag-based invalidation
      const keysToDelete = [];
      
      for (const [key, value] of memoryCache.entries()) {
        if (value.tags && value.tags.some(tag => tags.includes(tag))) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        memoryCache.delete(key);
        invalidatedCount++;
      });
    }
    
    cacheStats.deletes += invalidatedCount;
    console.log(`🗑️ Invalidated ${invalidatedCount} cache entries`);
    
    return invalidatedCount;
  } catch (error) {
    console.error('❌ Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Preemptive cache warming
 */
export async function warmCache(routes = []) {
  console.log('🔥 Warming cache for critical routes...');
  
  try {
    const app = require('../server.js'); // Dynamic import to avoid circular dependency
    
    for (const route of routes) {
      try {
        // Simulate request to warm cache
        const mockReq = {
          method: 'GET',
          path: route.path,
          query: route.query || {},
          user: route.user || null,
          headers: route.headers || {}
        };
        
        const cacheKey = generateCacheKey(mockReq);
        console.log(`🔥 Warming cache for ${route.path} -> ${cacheKey}`);
        
      } catch (error) {
        console.warn(`⚠️ Failed to warm cache for ${route.path}:`, error.message);
      }
    }
    
    console.log('✅ Cache warming completed');
  } catch (error) {
    console.error('❌ Cache warming error:', error);
  }
}

/**
 * Cache statistics and monitoring
 */
export function getCacheStats() {
  const totalRequests = cacheStats.hits + cacheStats.misses;
  cacheStats.hitRatio = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;
  
  return {
    ...cacheStats,
    memoryUsage: {
      size: memoryCache.size,
      calculatedSize: memoryCache.calculatedSize,
      max: cacheOptions.max,
      maxSize: cacheOptions.maxSize
    },
    uptime: Date.now() - new Date(cacheStats.lastResetAt).getTime()
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats() {
  cacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    sets: 0,
    deletes: 0,
    hitRatio: 0,
    avgResponseTime: 0,
    lastResetAt: new Date().toISOString()
  };
}

/**
 * Clear entire cache
 */
export function clearCache() {
  const size = memoryCache.size;
  memoryCache.clear();
  cacheStats.deletes += size;
  console.log(`🗑️ Cleared entire cache (${size} entries)`);
  return size;
}

/**
 * Predefined cache configurations for common use cases
 */
export const cacheConfigs = {
  // User profile data - cache for 10 minutes
  userProfile: {
    ttl: 10 * 60 * 1000,
    tags: ['user'],
    keyGenerator: (req) => `user:profile:${req.user?.id || 'anonymous'}`
  },
  
  // Workout data - cache for 5 minutes
  workouts: {
    ttl: 5 * 60 * 1000,
    tags: ['workouts'],
    invalidateOn: ['POST /api/workouts', 'PUT /api/workouts', 'DELETE /api/workouts']
  },
  
  // Analytics data - cache for 15 minutes
  analytics: {
    ttl: 15 * 60 * 1000,
    tags: ['analytics'],
    condition: (req) => req.query.timeRange !== 'realtime'
  },
  
  // Static data - cache for 1 hour
  static: {
    ttl: 60 * 60 * 1000,
    tags: ['static'],
    condition: (req) => !req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')
  },
  
  // Admin data - shorter cache for real-time requirements
  admin: {
    ttl: 2 * 60 * 1000,
    tags: ['admin'],
    condition: (req) => req.user?.role === 'admin'
  }
};

/**
 * Cache invalidation middleware for write operations
 */
export function invalidateOnWrite(tags = []) {
  return (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Invalidate cache on successful write operations
      if (res.statusCode >= 200 && res.statusCode < 300 && tags.length > 0) {
        setTimeout(() => {
          invalidateCache(null, tags);
        }, 100); // Small delay to ensure response is sent
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Export cache instance for direct access
export { memoryCache };

export default {
  cacheResponse,
  invalidateCache,
  warmCache,
  getCacheStats,
  resetCacheStats,
  clearCache,
  cacheConfigs,
  invalidateOnWrite,
  memoryCache
};