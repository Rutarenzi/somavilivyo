import { useCallback, useRef } from 'react';

interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    result?: any;
  };
}

interface UseApiRequestManagerOptions {
  cacheDuration?: number; // in milliseconds
  maxConcurrentRequests?: number;
}

export const useApiRequestManager = ({
  cacheDuration = 5000, // 5 seconds default
  maxConcurrentRequests = 10
}: UseApiRequestManagerOptions = {}) => {
  const requestCache = useRef<RequestCache>({});
  const activeRequests = useRef<Set<string>>(new Set());

  // Clean expired cache entries
  const cleanCache = useCallback(() => {
    const now = Date.now();
    Object.keys(requestCache.current).forEach(key => {
      const entry = requestCache.current[key];
      if (now - entry.timestamp > cacheDuration) {
        delete requestCache.current[key];
        activeRequests.current.delete(key);
      }
    });
  }, [cacheDuration]);

  // Generate cache key from request parameters
  const generateCacheKey = useCallback((url: string, options: any = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }, []);

  // Deduplicated request function
  const makeRequest = useCallback(async <T = any>(
    requestFn: () => Promise<T>,
    cacheKey: string
  ): Promise<T> => {
    // Clean old cache entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean cache
      cleanCache();
    }

    // Check if we have a cached result
    const cached = requestCache.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      console.log(`[ApiRequestManager] Cache hit for: ${cacheKey}`);
      if (cached.result) {
        return cached.result;
      }
      // Return the existing promise if still pending
      return cached.promise;
    }

    // Check if we're at max concurrent requests
    if (activeRequests.current.size >= maxConcurrentRequests) {
      console.warn(`[ApiRequestManager] Max concurrent requests reached (${maxConcurrentRequests})`);
      throw new Error('Too many concurrent requests. Please try again later.');
    }

    console.log(`[ApiRequestManager] Making new request: ${cacheKey}`);
    
    // Add to active requests
    activeRequests.current.add(cacheKey);

    // Create and cache the promise
    const promise = requestFn()
      .then((result) => {
        // Cache the successful result
        if (requestCache.current[cacheKey]) {
          requestCache.current[cacheKey].result = result;
        }
        return result;
      })
      .catch((error) => {
        // Remove failed request from cache
        delete requestCache.current[cacheKey];
        activeRequests.current.delete(cacheKey);
        throw error;
      })
      .finally(() => {
        // Remove from active requests
        activeRequests.current.delete(cacheKey);
      });

    // Cache the promise
    requestCache.current[cacheKey] = {
      promise,
      timestamp: Date.now()
    };

    return promise;
  }, [cacheDuration, maxConcurrentRequests, cleanCache]);

  // Supabase-specific optimized request wrapper
  const supabaseRequest = useCallback(async <T = any>(
    queryBuilder: any,
    options: {
      cacheKey?: string;
      bypassCache?: boolean;
    } = {}
  ): Promise<T> => {
    const { cacheKey, bypassCache = false } = options;
    
    if (bypassCache || !cacheKey) {
      return queryBuilder;
    }

    return makeRequest(() => queryBuilder, cacheKey);
  }, [makeRequest]);

  // Batch request function for multiple related queries
  const batchRequests = useCallback(async <T = any>(
    requests: Array<{
      requestFn: () => Promise<any>;
      cacheKey: string;
    }>
  ): Promise<T[]> => {
    console.log(`[ApiRequestManager] Batching ${requests.length} requests`);
    
    const promises = requests.map(({ requestFn, cacheKey }) => 
      makeRequest(requestFn, cacheKey)
    );

    return Promise.all(promises);
  }, [makeRequest]);

  // Clear specific cache entry
  const clearCache = useCallback((cacheKey?: string) => {
    if (cacheKey) {
      delete requestCache.current[cacheKey];
      activeRequests.current.delete(cacheKey);
      console.log(`[ApiRequestManager] Cleared cache for: ${cacheKey}`);
    } else {
      // Clear all cache
      requestCache.current = {};
      activeRequests.current.clear();
      console.log('[ApiRequestManager] Cleared all cache');
    }
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      cacheSize: Object.keys(requestCache.current).length,
      activeRequests: activeRequests.current.size,
      cacheKeys: Object.keys(requestCache.current)
    };
  }, []);

  return {
    makeRequest,
    supabaseRequest,
    batchRequests,
    clearCache,
    getCacheStats,
    generateCacheKey,
  };
};