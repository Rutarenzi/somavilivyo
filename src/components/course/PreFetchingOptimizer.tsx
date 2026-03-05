import { useEffect } from 'react';
import { useSmartCoursePrefetching } from '@/hooks/useSmartCoursePrefetching';
import { useAuth } from '@/contexts/AuthContext';

interface PreFetchingOptimizerProps {
  currentCourseId?: string;
  children: React.ReactNode;
}

export const PreFetchingOptimizer: React.FC<PreFetchingOptimizerProps> = ({ 
  currentCourseId, 
  children 
}) => {
  const { user } = useAuth();
  const { 
    preFetchRelatedCourses, 
    preWarmCache, 
    optimizeCache,
    preFetchStats,
    cacheHitRate 
  } = useSmartCoursePrefetching();

  // Pre-fetch related courses when user views a course
  useEffect(() => {
    if (currentCourseId && user) {
      preFetchRelatedCourses(currentCourseId);
    }
  }, [currentCourseId, user, preFetchRelatedCourses]);

  // Pre-warm cache when component mounts
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        preWarmCache();
      }, 3000); // Wait 3 seconds after mount to pre-warm

      return () => clearTimeout(timer);
    }
  }, [user, preWarmCache]);

  // Optimize cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      optimizeCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [optimizeCache]);

  // Log performance stats in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && cacheHitRate > 0) {
      console.log('📊 Cache Performance:', {
        hitRate: `${cacheHitRate}%`,
        prefetchedCourses: preFetchStats.coursesPreFetched,
        prefetchedModules: preFetchStats.modulesPreFetched
      });
    }
  }, [cacheHitRate, preFetchStats]);

  return <>{children}</>;
};