import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { performanceCache, PERF_CACHE_KEYS } from '@/utils/performanceCache';

export interface OptimizedCourse {
  id: string;
  title: string;
  description: string;
  skill_area: string;
  difficulty_level: string;
  estimated_duration: string;
  category?: string;
  status: string;
  created_at: string;
  topics?: any[];
  is_shared?: boolean;
  shared_by?: string;
  _cached?: boolean;
}

export const useOptimizedCourses = () => {
  const [courses, setCourses] = useState<OptimizedCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Optimized fetch with aggressive caching
  const fetchCourses = useCallback(async (skipCache = false) => {
    if (!user) {
      setLoading(false);
      setInitialLoading(false);
      return;
    }

    const cacheKey = PERF_CACHE_KEYS.COURSES_LIST(user.id);
    
    // Try cache first for instant loading
    if (!skipCache) {
      const cachedCourses = performanceCache.get<OptimizedCourse[]>(cacheKey);
      if (cachedCourses) {
        console.log('📦 Loading courses from cache (instant)');
        setCourses(cachedCourses.map(c => ({ ...c, _cached: true })));
        setInitialLoading(false);
        return;
      }
    }

    setLoading(true);

    try {
      console.log('🔄 Fetching courses from database');
      
      // Fetch owned courses - optimized query with essential fields only
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
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (ownedError) {
        console.error('Error fetching owned courses:', ownedError);
      }

      // Fetch shared courses
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
            created_at
          )
        `)
        .eq('user_id', user.id)
        .limit(10);

      if (sharedError) {
        console.error('Error fetching shared courses:', sharedError);
      }

      const optimizedCourses: OptimizedCourse[] = [
        ...(ownedCourses || []).map(course => ({
          id: course.id,
          title: course.title,
          description: course.description || '',
          skill_area: course.skill_area,
          difficulty_level: course.difficulty_level,
          estimated_duration: course.estimated_duration || '2-3 hours',
          status: course.status || 'draft',
          created_at: course.created_at,
          is_shared: false
        })),
        ...(sharedCourses || []).map(item => ({
          id: item.courses.id,
          title: item.courses.title,
          description: item.courses.description || '',
          skill_area: item.courses.skill_area,
          difficulty_level: item.courses.difficulty_level,
          estimated_duration: item.courses.estimated_duration || '2-3 hours',
          status: item.courses.status || 'draft',
          created_at: item.courses.created_at,
          is_shared: true,
          shared_by: item.granted_by
        }))
      ];

      setCourses(optimizedCourses);
      
      // Cache for 30 minutes
      performanceCache.set(cacheKey, optimizedCourses, 30 * 60 * 1000);

    } catch (error) {
      console.error('Unexpected error fetching courses:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [user, toast]);

  // Optimized course detail fetch
  const fetchCourseDetails = useCallback(async (courseId: string) => {
    if (!user) return null;

    const cacheKey = PERF_CACHE_KEYS.COURSE_DETAIL(courseId);
    const cached = performanceCache.get(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('topics')
        .eq('id', courseId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const details = { topics: data.topics || [] };
      performanceCache.set(cacheKey, details, 15 * 60 * 1000);
      return details;
    } catch (error) {
      console.error('Error fetching course details:', error);
      return null;
    }
  }, [user]);

  // Prefetch critical data on mount
  useEffect(() => {
    if (user) {
      // Start fetching immediately
      fetchCourses();
      
      // Prefetch user stats in background
      performanceCache.prefetch(
        PERF_CACHE_KEYS.USER_STATS(user.id),
        async () => {
          const { data } = await supabase
            .from('user_micro_progress')
            .select('completed_at, quiz_score')
            .eq('user_id', user.id);
          return data || [];
        }
      );
    }
  }, [user, fetchCourses]);

  // Memoized derived data
  const courseStats = useMemo(() => {
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.status === 'completed').length;
    const activeCourses = courses.filter(c => c.status === 'active').length;
    
    return {
      totalCourses,
      completedCourses,
      activeCourses,
      progressPercentage: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0
    };
  }, [courses]);

  return {
    courses,
    loading,
    initialLoading,
    courseStats,
    fetchCourses: () => fetchCourses(true),
    fetchCourseDetails,
    refetch: () => fetchCourses(true)
  };
};
