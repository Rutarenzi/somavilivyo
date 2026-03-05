
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class PerformanceCache {
  protected cache = new Map<string, CacheItem<any>>();
  protected memoryCache = new Map<string, any>();
  protected stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  protected prefetchQueue = new Set<string>();

  // Aggressive caching for course data
  set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.stats.size = this.cache.size;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return item.data as T;
  }

  // Prefetch strategy for critical data
  prefetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return Promise.resolve(cached);

    return fetcher().then(data => {
      this.set(key, data, ttl);
      return data;
    });
  }

  // Mark for prefetch without actually fetching
  markForPrefetch(key: string): void {
    this.prefetchQueue.add(key);
  }

  // Memory cache for immediate access
  setImmediate<T>(key: string, data: T): void {
    this.memoryCache.set(key, data);
  }

  getImmediate<T>(key: string): T | null {
    return this.memoryCache.get(key) || null;
  }

  // Batch invalidation for related data
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    this.stats.size = this.cache.size;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.memoryCache.clear();
    this.prefetchQueue.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
  }
}

export const performanceCache = new PerformanceCache();

// Performance-optimized cache keys
export const PERF_CACHE_KEYS = {
  COURSES_LIST: (userId: string) => `courses_list_${userId}`,
  COURSE_DETAIL: (courseId: string) => `course_detail_${courseId}`,
  USER_STATS: (userId: string) => `user_stats_${userId}`,
  DASHBOARD_DATA: (userId: string) => `dashboard_${userId}`,
  MODULES_COUNT: (courseId: string) => `modules_count_${courseId}`,
  PROGRESS_DATA: (userId: string, courseId: string) => `progress_${userId}_${courseId}`,
  COURSE_ANALYTICS: (courseId: string) => `analytics_${courseId}`,
  USER_INSIGHTS: (userId: string, courseId: string) => `insights_${userId}_${courseId}`,
} as const;

// Enhanced cache with compression for large datasets
export class OptimizedCacheManager extends PerformanceCache {
  // Batch operations for improved performance
  setMany<T>(entries: Array<[string, T, number?]>): void {
    entries.forEach(([key, data, ttl]) => {
      this.set(key, data, ttl);
    });
  }

  // Smart invalidation with patterns
  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    this.stats.size = this.cache.size;
    return count;
  }

  // Background cleanup of expired entries
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    this.stats.size = this.cache.size;
    return cleaned;
  }
}

export const optimizedCache = new OptimizedCacheManager();
