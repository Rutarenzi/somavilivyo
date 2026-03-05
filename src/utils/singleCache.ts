import { performanceCache } from './performanceCache';

/**
 * Single unified cache layer to eliminate duplicate caching mechanisms
 * This replaces the separate caches that were causing conflicts
 */
class SingleCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();

  set<T>(key: string, data: T, ttlMs: number = 15 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    // Also set in performance cache to maintain compatibility
    performanceCache.set(key, data, ttlMs);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      // Try performance cache as fallback
      return performanceCache.get<T>(key);
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      performanceCache.invalidatePattern(key);
      return null;
    }

    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    performanceCache.invalidatePattern(key);
  }

  invalidatePattern(pattern: string): number {
    let count = 0;
    
    // Clear from local cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    // Clear from performance cache
    performanceCache.invalidatePattern(pattern);
    
    return count;
  }

  clear(): void {
    this.cache.clear();
    performanceCache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const singleCache = new SingleCache();

// Cache key generators
export const CACHE_KEYS = {
  USER_COURSES: (userId: string) => `courses_${userId}`,
  COURSE_DATA: (courseId: string) => `course_${courseId}`,
  COURSE_MODULES: (courseId: string) => `modules_${courseId}`,
  USER_PROGRESS: (userId: string, courseId: string) => `progress_${userId}_${courseId}`,
  DASHBOARD_DATA: (userId: string) => `dashboard_${userId}`,
  ANALYTICS: (userId: string, courseId: string) => `analytics_${userId}_${courseId}`
};