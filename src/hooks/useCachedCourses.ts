import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cacheManager, CACHE_KEYS } from '@/utils/cache';

interface Course {
  id: string;
  title: string;
  description?: string;
  topics: any[];
  status: string;
  created_at: string;
  difficulty_level?: string;
  skill_area?: string;
  category?: string;
  is_shared?: boolean;
  shared_by?: string;
}

export function useCachedCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    const cacheKey = CACHE_KEYS.COURSES(user.id);
    
    // Try to get from cache first
    if (!forceRefresh) {
      const cachedCourses = cacheManager.get<Course[]>(cacheKey);
      if (cachedCourses) {
        console.log('📦 Loading courses from cache');
        setCourses(cachedCourses);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('🔄 Fetching courses from database');
      
      // Fetch owned courses
      const { data: ownedCourses, error: ownedError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch shared courses
      const { data: sharedCourses, error: sharedError } = await supabase
        .from('shared_course_access')
        .select(`
          course_id,
          courses!inner(*)
        `)
        .eq('user_id', user.id);

      if (sharedError) throw sharedError;

      // Combine and transform courses
      const allCourses = [
        ...(ownedCourses || []).map(course => ({
          ...course,
          topics: Array.isArray(course.topics) ? course.topics : [],
          is_shared: false
        })),
        ...(sharedCourses || []).map(item => ({
          ...item.courses,
          topics: Array.isArray(item.courses.topics) ? item.courses.topics : [],
          is_shared: true
        }))
      ];

      setCourses(allCourses);
      // Cache for 10 minutes
      cacheManager.set(cacheKey, allCourses, 10 * 60 * 1000);
      
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<Course>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state and cache
      setCourses(prev => prev.map(course => 
        course.id === courseId ? { ...course, ...updates } : course
      ));

      // Invalidate cache to force refresh on next load
      cacheManager.delete(CACHE_KEYS.COURSES(user.id));
      cacheManager.delete(CACHE_KEYS.COURSE(courseId));
      
      toast.success('Course updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update course:', error);
      toast.error('Failed to update course');
      return false;
    }
  }, [user]);

  // Set up real-time subscription with cache invalidation
  useEffect(() => {
    if (user) {
      fetchCourses();

      const coursesChannel = supabase
        .channel('user-courses-cached')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'courses',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('🔄 Course updated, invalidating cache...');
            cacheManager.delete(CACHE_KEYS.COURSES(user.id));
            fetchCourses(true);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shared_course_access',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('🔄 Shared course access updated, invalidating cache...');
            cacheManager.delete(CACHE_KEYS.COURSES(user.id));
            fetchCourses(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(coursesChannel);
      };
    }
  }, [user, fetchCourses]);

  return {
    courses,
    loading,
    fetchCourses,
    updateCourse,
    refreshCourses: () => fetchCourses(true)
  };
}
