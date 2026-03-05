import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { performanceCache, PERF_CACHE_KEYS } from '@/utils/performanceCache';

export interface OptimizedCourseEnhanced {
  id: string;
  title: string;
  description: string;
  skill_area: string;
  difficulty_level: string;
  estimated_duration: string;
  category?: string;
  status: string;
  created_at: string;
  is_shared?: boolean;
  shared_by?: string;
  _cached?: boolean;
  // Enhanced fields for performance
  total_modules?: number;
  completed_modules?: number;
  progress_percentage?: number;
  last_activity?: string;
  // Keep topics for compatibility
  topics?: any[];
}

export const useOptimizedCoursesEnhanced = () => {
  const [courses, setCourses] = useState<OptimizedCourseEnhanced[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Optimized fetch with specific field selection and JOINs
  const fetchCoursesEnhanced = useCallback(async (skipCache = false) => {
    if (!user) {
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    const cacheKey = PERF_CACHE_KEYS.COURSES_LIST(user.id);
    
    // Try cache first for instant loading
    if (!skipCache) {
      const cachedCourses = performanceCache.get<OptimizedCourseEnhanced[]>(cacheKey);
      if (cachedCourses) {
        console.log('📦 Loading enhanced courses from cache (instant)');
        setCourses(cachedCourses.map(c => ({ ...c, _cached: true })));
        setInitialLoading(false);
        
        // Background refresh for fresh data
        setTimeout(() => fetchCoursesEnhanced(true), 100);
        return;
      }
    }

    setLoading(true);

    try {
      console.log('🔄 Fetching enhanced courses from database');
      
      // Optimized query: SELECT only essential fields
      const { data: ownedCourses, error: ownedError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          skill_area,
          difficulty_level,
          estimated_duration,
          status,
          created_at,
          category
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Pagination - limit to 50 most recent

      if (ownedError) {
        console.error('Error fetching owned courses:', ownedError);
        throw ownedError;
      }

      // Optimized shared courses query
      const { data: sharedCourses, error: sharedError } = await supabase
        .from('shared_course_access')
        .select(`
          granted_by,
          courses!inner(
            id,
            title,
            description,
            skill_area,
            difficulty_level,
            estimated_duration,
            status,
            created_at,
            category
          )
        `)
        .eq('user_id', user.id)
        .limit(20);

      if (sharedError) {
        console.error('Error fetching shared courses:', sharedError);
        // Don't throw - shared courses are non-critical
      }

      // Get course IDs for batch progress lookup
      const allCourseIds = [
        ...(ownedCourses || []).map(c => c.id),
        ...(sharedCourses || []).map(item => item.courses.id)
      ];

      // Batch fetch progress data for all courses
      let progressData: Record<string, { total: number; completed: number }> = {};
      if (allCourseIds.length > 0) {
        const { data: moduleProgress } = await supabase
          .from('user_micro_progress')
          .select('course_id, completed_at')
          .eq('user_id', user.id)
          .in('course_id', allCourseIds);

        const { data: moduleCounts } = await supabase
          .from('micro_modules')
          .select('course_id')
          .in('course_id', allCourseIds);

        // Process progress data
        if (moduleProgress && moduleCounts) {
          const completedByCourse = moduleProgress.reduce((acc, item) => {
            if (item.completed_at) {
              acc[item.course_id] = (acc[item.course_id] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);

          const totalByCourse = moduleCounts.reduce((acc, item) => {
            acc[item.course_id] = (acc[item.course_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          progressData = Object.keys(totalByCourse).reduce((acc, courseId) => {
            acc[courseId] = {
              total: totalByCourse[courseId] || 0,
              completed: completedByCourse[courseId] || 0
            };
            return acc;
          }, {} as Record<string, { total: number; completed: number }>);
        }
      }

      const enhancedCourses: OptimizedCourseEnhanced[] = [
        ...(ownedCourses || []).map(course => {
          const progress = progressData[course.id] || { total: 0, completed: 0 };
          return {
            id: course.id,
            title: course.title,
            description: course.description || '',
            skill_area: course.skill_area,
            difficulty_level: course.difficulty_level,
            estimated_duration: course.estimated_duration || '2-3 hours',
            category: course.category,
            status: course.status || 'draft',
            created_at: course.created_at,
            is_shared: false,
            total_modules: progress.total,
            completed_modules: progress.completed,
            progress_percentage: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
          };
        }),
        ...(sharedCourses || []).map(item => {
          const progress = progressData[item.courses.id] || { total: 0, completed: 0 };
          return {
            id: item.courses.id,
            title: item.courses.title,
            description: item.courses.description || '',
            skill_area: item.courses.skill_area,
            difficulty_level: item.courses.difficulty_level,
            estimated_duration: item.courses.estimated_duration || '2-3 hours',
            category: item.courses.category,
            status: item.courses.status || 'draft',
            created_at: item.courses.created_at,
            is_shared: true,
            shared_by: item.granted_by,
            total_modules: progress.total,
            completed_modules: progress.completed,
            progress_percentage: progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
          };
        })
      ];

      setCourses(enhancedCourses);
      
      // Cache for 15 minutes with longer TTL for enhanced data
      performanceCache.set(cacheKey, enhancedCourses, 15 * 60 * 1000);

      // Prefetch details for first 3 courses in background
      enhancedCourses.slice(0, 3).forEach(course => {
        const detailKey = PERF_CACHE_KEYS.COURSE_DETAIL(course.id);
        if (!performanceCache.get(detailKey)) {
          performanceCache.markForPrefetch(detailKey);
        }
      });

    } catch (error) {
      console.error('Unexpected error fetching enhanced courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [user, toast]);

  // Optimized course detail fetch with caching
  const fetchCourseDetails = useCallback(async (courseId: string) => {
    if (!user) return null;

    const cacheKey = PERF_CACHE_KEYS.COURSE_DETAIL(courseId);
    const cached = performanceCache.get(cacheKey);
    if (cached) return cached;

    try {
      // Only fetch topics when needed
      const { data, error } = await supabase
        .from('courses')
        .select('topics')
        .eq('id', courseId)
        .single();

      if (error) throw error;

      const details = { topics: data.topics || [] };
      performanceCache.set(cacheKey, details, 30 * 60 * 1000); // Cache for 30 minutes
      return details;
    } catch (error) {
      console.error('Error fetching course details:', error);
      return null;
    }
  }, [user]);

  // Batch update multiple courses efficiently
  const updateCourse = useCallback(async (courseId: string, updates: Partial<OptimizedCourseEnhanced>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCourses(prev => prev.map(course => 
        course.id === courseId ? { ...course, ...updates } : course
      ));

      // Invalidate related caches
      performanceCache.invalidatePattern(`courses_.*_${user.id}`);
      performanceCache.invalidatePattern(`course_detail_${courseId}`);
      
      return true;
    } catch (error) {
      console.error('Failed to update course:', error);
      return false;
    }
  }, [user]);

  // Prefetch critical data on mount
  useEffect(() => {
    if (user) {
      fetchCoursesEnhanced();
      
      // Prefetch dashboard stats in background
      performanceCache.prefetch(
        PERF_CACHE_KEYS.DASHBOARD_DATA(user.id),
        async () => {
          const { data } = await supabase
            .from('user_micro_progress')
            .select('completed_at, quiz_score, course_id')
            .eq('user_id', user.id)
            .limit(100);
          return data || [];
        },
        10 * 60 * 1000 // 10 minutes cache
      );
    }
  }, [user, fetchCoursesEnhanced]);

  // Memoized derived data with enhanced stats
  const courseStats = useMemo(() => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.progress_percentage === 100).length;
    const activeCourses = courses.filter(c => c.status === 'active' || (c.progress_percentage > 0 && c.progress_percentage < 100)).length;
    const averageProgress = courses.length > 0 
      ? Math.round(courses.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / courses.length)
      : 0;
    const totalModules = courses.reduce((sum, c) => sum + (c.total_modules || 0), 0);
    const completedModules = courses.reduce((sum, c) => sum + (c.completed_modules || 0), 0);
    
    return {
      totalCourses,
      completedCourses,
      activeCourses,
      averageProgress,
      totalModules,
      completedModules,
      progressPercentage: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
    };
  }, [courses]);

  return {
    courses,
    loading,
    initialLoading,
    courseStats,
    fetchCourses: () => fetchCoursesEnhanced(true),
    fetchCourseDetails,
    updateCourse,
    refetch: () => fetchCoursesEnhanced(true)
  };
};