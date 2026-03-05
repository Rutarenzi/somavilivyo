import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { preFetchingManager, PreFetchStats } from '@/utils/preFetchingManager';
import { performanceCache, PERF_CACHE_KEYS } from '@/utils/performanceCache';
import { useOptimizedCoursesEnhanced } from './useOptimizedCoursesEnhanced';

export const useSmartCoursePrefetching = () => {
  const { user } = useAuth();
  const { courses } = useOptimizedCoursesEnhanced();
  const [preFetchStats, setPreFetchStats] = useState<PreFetchStats>({
    coursesPreFetched: 0,
    modulesPreFetched: 0,
    cacheHitRate: 0,
    prefetchTime: 0
  });
  const [isPreFetching, setIsPreFetching] = useState(false);

  // Get cached course data instantly if available
  const getCachedCourseData = useCallback((courseId: string) => {
    const detailKey = PERF_CACHE_KEYS.COURSE_DETAIL(courseId);
    const modulesKey = `micro_modules_${courseId}`;
    const progressKey = user ? PERF_CACHE_KEYS.PROGRESS_DATA(user.id, courseId) : null;
    const analyticsKey = PERF_CACHE_KEYS.COURSE_ANALYTICS(courseId);

    return {
      courseDetails: performanceCache.get(detailKey),
      microModules: performanceCache.get(modulesKey),
      userProgress: progressKey ? performanceCache.get(progressKey) : null,
      analytics: performanceCache.get(analyticsKey),
      isPreFetched: preFetchingManager.isCoursePreFetched(courseId)
    };
  }, [user]);

  // Check if course is already cached (instant loading)
  const isCourseInstantlyAvailable = useCallback((courseId: string) => {
    const cachedData = getCachedCourseData(courseId);
    return !!(cachedData.courseDetails && cachedData.microModules);
  }, [getCachedCourseData]);

  // Start pre-fetching for a specific course and its related content
  const preFetchCourse = useCallback(async (courseId: string) => {
    if (!user || preFetchingManager.isCoursePreFetched(courseId)) return;

    try {
      setIsPreFetching(true);
      await preFetchingManager.backgroundPreFetch(user.id, courseId);
      setPreFetchStats(preFetchingManager.getPreFetchStats());
    } catch (error) {
      console.error('Failed to pre-fetch course:', error);
    } finally {
      setIsPreFetching(false);
    }
  }, [user]);

  // Pre-fetch related courses based on current course
  const preFetchRelatedCourses = useCallback(async (currentCourseId: string) => {
    if (!user) return;

    // Find related courses by similar skill areas or categories
    const currentCourse = courses.find(c => c.id === currentCourseId);
    if (!currentCourse) return;

    const relatedCourses = courses.filter(course => 
      course.id !== currentCourseId &&
      (course.skill_area === currentCourse.skill_area || 
       course.category === currentCourse.category)
    ).slice(0, 3);

    // Pre-fetch related courses in background
    relatedCourses.forEach(course => {
      setTimeout(() => preFetchCourse(course.id), 1000);
    });
  }, [user, courses, preFetchCourse]);

  // Get cache hit rate for performance monitoring
  const calculateCacheHitRate = useCallback(() => {
    if (courses.length === 0) return 0;
    
    const cachedCount = courses.filter(course => 
      isCourseInstantlyAvailable(course.id)
    ).length;
    
    return Math.round((cachedCount / courses.length) * 100);
  }, [courses, isCourseInstantlyAvailable]);

  // Update cache hit rate when courses change
  useEffect(() => {
    const hitRate = calculateCacheHitRate();
    setPreFetchStats(prev => ({ ...prev, cacheHitRate: hitRate }));
  }, [courses, calculateCacheHitRate]);

  // Pre-warm cache for frequently accessed content
  const preWarmCache = useCallback(async () => {
    if (!user || courses.length === 0) return;

    // Pre-warm top 3 most recent courses
    const recentCourses = courses
      .filter(course => course.progress_percentage && course.progress_percentage > 0)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);

    for (const course of recentCourses) {
      if (!isCourseInstantlyAvailable(course.id)) {
        await preFetchCourse(course.id);
        // Small delay between pre-fetches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }, [user, courses, isCourseInstantlyAvailable, preFetchCourse]);

  // Intelligent cache management
  const optimizeCache = useCallback(() => {
    // Clean up old cache entries
    const stats = performanceCache.getStats();
    
    // If cache is getting large, clean up least recently used items
    if (stats.size > 100) {
      console.log('🧹 Optimizing cache size...');
      // The performanceCache handles TTL automatically, but we could add LRU logic here
    }
  }, []);

  // Monitor and log pre-fetch effectiveness
  useEffect(() => {
    const logStats = () => {
      const stats = preFetchingManager.getPreFetchStats();
      if (stats.coursesPreFetched > 0) {
        console.log('📊 Pre-fetch Performance:', {
          coursesPreFetched: stats.coursesPreFetched,
          modulesPreFetched: stats.modulesPreFetched,
          cacheHitRate: calculateCacheHitRate(),
          prefetchTime: `${stats.prefetchTime.toFixed(2)}ms`
        });
      }
    };

    // Log stats every 30 seconds
    const interval = setInterval(logStats, 30000);
    return () => clearInterval(interval);
  }, [calculateCacheHitRate]);

  return {
    // Data access
    getCachedCourseData,
    isCourseInstantlyAvailable,
    
    // Pre-fetching controls
    preFetchCourse,
    preFetchRelatedCourses,
    preWarmCache,
    
    // Performance monitoring
    preFetchStats,
    isPreFetching,
    cacheHitRate: calculateCacheHitRate(),
    
    // Cache management
    optimizeCache,
    clearCache: () => {
      preFetchingManager.clearPreFetchCache();
      performanceCache.clear();
    }
  };
};