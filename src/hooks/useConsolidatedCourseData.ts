import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { singleCache, CACHE_KEYS } from '@/utils/singleCache';

export interface ConsolidatedCourse {
  id: string;
  title: string;
  description: string;
  skill_area: string;
  difficulty_level: string;
  estimated_duration: string;
  category?: string;
  topics: any[];
  status: string;
  created_at: string;
  is_shared?: boolean;
  shared_by?: string;
  progressStats?: {
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
  };
}

/**
 * Consolidated hook that replaces both useCourses and useMicroModules
 * Eliminates duplicate API calls and provides unified data management
 */
export const useConsolidatedCourseData = () => {
  const [courses, setCourses] = useState<ConsolidatedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAllCourseData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Please sign in to view courses");
      return;
    }

    try {
      setError(null);
      
      // Check cache first
      const cacheKey = CACHE_KEYS.USER_COURSES(user.id);
      const cachedData = singleCache.get<ConsolidatedCourse[]>(cacheKey);
      
      if (cachedData) {
        console.log('📦 Loading courses from cache');
        setCourses(cachedData);
        setLoading(false);
        
        // Background refresh
        setTimeout(() => fetchFreshData(), 100);
        return;
      }

      await fetchFreshData();
    } catch (err) {
      console.error('Error fetching consolidated course data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [user]);

  const fetchFreshData = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🔄 Fetching fresh consolidated course data with enhanced error handling');

      // Single optimized query using Promise.all for better performance with enhanced error handling
      const [ownedCoursesResult, sharedCoursesResult, progressResult, moduleCountsResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, description, skill_area, difficulty_level, estimated_duration, category, topics, status, created_at')
          .eq('user_id', user.id)
          .in('status', ['published', 'active'])
          .eq('is_template_course', false)
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('shared_course_access')
          .select(`
            course_id,
            granted_by,
            courses!inner(id, title, description, skill_area, difficulty_level, estimated_duration, category, topics, status, created_at)
          `)
          .eq('user_id', user.id)
          .limit(10),
        
        supabase
          .from('user_micro_progress')
          .select('course_id, micro_module_id, completed_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(500),
        
        supabase
          .from('micro_modules')
          .select('course_id, id')
          .limit(1000)
      ]);

      // Enhanced error handling with specific error messages
      if (ownedCoursesResult.error) {
        console.error('Error fetching owned courses:', ownedCoursesResult.error);
        throw new Error(`Failed to fetch owned courses: ${ownedCoursesResult.error.message}`);
      }

      if (progressResult.error) {
        console.error('Error fetching progress:', progressResult.error);
        throw new Error(`Failed to fetch progress data: ${progressResult.error.message}`);
      }

      if (moduleCountsResult.error) {
        console.error('Error fetching module counts:', moduleCountsResult.error);
        throw new Error(`Failed to fetch module counts: ${moduleCountsResult.error.message}`);
      }

      // Process module counts by course
      const moduleCountsByCourse = (moduleCountsResult.data || []).reduce((acc, module) => {
        if (!acc[module.course_id]) {
          acc[module.course_id] = { total: 0, moduleIds: [] };
        }
        acc[module.course_id].total++;
        acc[module.course_id].moduleIds.push(module.id);
        return acc;
      }, {} as Record<string, { total: number; moduleIds: string[] }>);

      // Process progress data efficiently with actual completion tracking
      const progressByCourse = (progressResult.data || []).reduce((acc, p) => {
        if (!acc[p.course_id]) {
          acc[p.course_id] = { completed: 0, completedModuleIds: new Set() };
        }
        if (p.completed_at && p.micro_module_id) {
          acc[p.course_id].completedModuleIds.add(p.micro_module_id);
        }
        return acc;
      }, {} as Record<string, { completed: number; completedModuleIds: Set<string> }>);

      // Calculate completed counts
      Object.keys(progressByCourse).forEach(courseId => {
        progressByCourse[courseId].completed = progressByCourse[courseId].completedModuleIds.size;
      });

      // Enhanced data validation and JSON corruption handling
      const processedOwnedCourses = (ownedCoursesResult.data || [])
        .filter(course => {
          // Validate essential course data
          if (!course.id || !course.title) {
            console.warn(`[fetchFreshData] Skipping course with missing essential data:`, course);
            return false;
          }
          return true;
        })
        .map(course => {
          try {
            const progress = progressByCourse[course.id] || { completed: 0, completedModuleIds: new Set() };
            const moduleCounts = moduleCountsByCourse[course.id] || { total: 0, moduleIds: [] };
            
            // Safe JSON handling for topics field
            let safeTopics = [];
            try {
              if (course.topics) {
                if (Array.isArray(course.topics)) {
                  safeTopics = course.topics;
                } else if (typeof course.topics === 'string') {
                  safeTopics = JSON.parse(course.topics);
                } else if (typeof course.topics === 'object') {
                  safeTopics = Object.values(course.topics);
                }
              }
            } catch (jsonError) {
              console.warn(`[fetchFreshData] JSON corruption detected in course ${course.id} topics:`, jsonError);
              safeTopics = []; // Use empty array as fallback
            }

            return {
              ...course,
              title: course.title || 'Untitled Course',
              description: course.description || '',
              skill_area: course.skill_area || 'General',
              difficulty_level: course.difficulty_level || 'Beginner',
              estimated_duration: course.estimated_duration || 'Not specified',
              category: course.category || 'General',
              topics: safeTopics,
              is_shared: false,
              progressStats: {
                completedModules: progress.completed,
                totalModules: moduleCounts.total,
                progressPercentage: moduleCounts.total > 0 ? Math.round((progress.completed / moduleCounts.total) * 100) : 0
              }
            };
          } catch (courseError) {
            console.error(`[fetchFreshData] Error processing course ${course.id}:`, courseError);
            // Return safe fallback course
            return {
              id: course.id,
              title: course.title || 'Corrupted Course',
              description: 'This course has data issues and may need to be regenerated.',
              skill_area: 'General',
              difficulty_level: 'Beginner',
              estimated_duration: 'Unknown',
              category: 'General',
              topics: [],
              status: course.status || 'draft',
              created_at: course.created_at,
              is_shared: false,
              progressStats: {
                completedModules: 0,
                totalModules: moduleCountsByCourse[course.id]?.total || 0,
                progressPercentage: 0
              }
            };
          }
        });

      // Process shared courses with similar validation
      const processedSharedCourses = (sharedCoursesResult.data || [])
        .filter(item => item.courses && item.courses.id && item.courses.title)
        .map(item => {
          try {
            const course = item.courses;
            const progress = progressByCourse[course.id] || { completed: 0, completedModuleIds: new Set() };
            const moduleCounts = moduleCountsByCourse[course.id] || { total: 0, moduleIds: [] };
            
            // Safe JSON handling for shared course topics
            let safeTopics = [];
            try {
              if (course.topics) {
                safeTopics = Array.isArray(course.topics) ? course.topics : 
                            typeof course.topics === 'string' ? JSON.parse(course.topics) : 
                            [];
              }
            } catch (jsonError) {
              console.warn(`[fetchFreshData] JSON corruption in shared course ${course.id}:`, jsonError);
              safeTopics = [];
            }

            return {
              ...course,
              title: course.title || 'Untitled Shared Course',
              description: course.description || '',
              skill_area: course.skill_area || 'General',
              difficulty_level: course.difficulty_level || 'Beginner',
              estimated_duration: course.estimated_duration || 'Not specified',
              category: course.category || 'General',
              topics: safeTopics,
              is_shared: true,
              shared_by: item.granted_by,
              progressStats: {
                completedModules: progress.completed,
                totalModules: moduleCounts.total,
                progressPercentage: moduleCounts.total > 0 ? Math.round((progress.completed / moduleCounts.total) * 100) : 0
              }
            };
          } catch (sharedError) {
            console.error(`[fetchFreshData] Error processing shared course:`, sharedError);
            return null;
          }
        })
        .filter(course => course !== null);

      const allCourses: ConsolidatedCourse[] = [
        ...processedOwnedCourses,
        ...processedSharedCourses
      ];

      setCourses(allCourses);
      
      // Cache the data
      const cacheKey = CACHE_KEYS.USER_COURSES(user.id);
      singleCache.set(cacheKey, allCourses, 15 * 60 * 1000); // 15 minutes

      console.log(`✅ Loaded ${allCourses.length} courses with enhanced data validation`);
    } catch (err) {
      console.error('Error in fetchFreshData:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load courses';
      setError(errorMessage);
      
      toast({
        title: "Error Loading Courses",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateCourse = useCallback(async (courseId: string, updateData: Partial<ConsolidatedCourse>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update courses.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCourses(prev => 
        prev.map(course => 
          course.id === courseId 
            ? { ...course, ...updateData }
            : course
        )
      );
      
      // Invalidate cache
      const cacheKey = CACHE_KEYS.USER_COURSES(user.id);
      singleCache.invalidate(cacheKey);
      
      return true;
    } catch (err) {
      console.error('Error updating course:', err);
      toast({
        title: "Update Failed",
        description: "Failed to update the course. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  const deleteCourse = useCallback(async (courseId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete courses.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCourses(prev => prev.filter(course => course.id !== courseId));
      
      // Invalidate cache
      const cacheKey = CACHE_KEYS.USER_COURSES(user.id);
      singleCache.invalidate(cacheKey);
      
      toast({
        title: "Course Deleted",
        description: "The course has been successfully deleted.",
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting course:', err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the course. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAllCourseData();
  }, [fetchAllCourseData]);

  return {
    courses,
    loading,
    error,
    refetch: fetchAllCourseData,
    updateCourse,
    deleteCourse
  };
};