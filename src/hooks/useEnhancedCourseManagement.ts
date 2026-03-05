import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cacheManager, CACHE_KEYS } from '@/utils/cache';

interface Course {
  id: string;
  title: string;
  topics: Topic[];
  status: string;
  created_at: string;
  category?: string;
}

interface Topic {
  title: string;
  description?: string;
  subtopics: Subtopic[];
  estimatedDuration?: string;
}

interface Subtopic {
  title: string;
  description?: string;
  micro_modules: MicroModule[];
  estimatedDuration?: string;
}

interface MicroModule {
  title: string;
  content: string;
  learning_objective: string;
  estimated_duration_minutes?: number;
  quick_quiz?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
  real_world_example?: string;
}

interface UserProgress {
  [key: string]: boolean;
}

export function useEnhancedCourseManagement() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({});
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    const cacheKey = CACHE_KEYS.COURSES(user.id);
    
    // Check cache first
    if (!forceRefresh) {
      const cachedCourses = cacheManager.get<Course[]>(cacheKey);
      if (cachedCourses) {
        console.log('📦 Loading courses from cache (enhanced)');
        setCourses(cachedCourses);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('🔄 Fetching courses from database (enhanced)');
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedCourses = coursesData?.map(course => ({
        ...course,
        topics: Array.isArray(course.topics) ? course.topics as unknown as Topic[] : []
      })) || [];

      setCourses(transformedCourses);
      
      // Cache for 10 minutes
      cacheManager.set(cacheKey, transformedCourses, 10 * 60 * 1000);
      
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProgress = useCallback(async (courseId: string, forceRefresh = false) => {
    if (!user) return;

    const progressCacheKey = CACHE_KEYS.USER_PROGRESS(courseId, user.id);
    
    // Check cache first
    if (!forceRefresh) {
      const cachedProgress = cacheManager.get<UserProgress>(progressCacheKey);
      if (cachedProgress) {
        console.log('📦 Loading user progress from cache');
        setUserProgress(cachedProgress);
        return;
      }
    }

    try {
      console.log('🔄 Fetching user progress from database');
      
      // Fetch from micro_modules table to get the actual module data with indices
      const { data: modulesData, error: modulesError } = await supabase
        .from('micro_modules')
        .select('*')
        .eq('course_id', courseId);

      if (modulesError) throw modulesError;

      // Fetch user progress with real-time data
      const { data: progressData, error: progressError } = await supabase
        .from('user_micro_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      const progress: UserProgress = {};
      
      // Create a map of micro_module_id to progress
      const progressMap = new Map();
      progressData?.forEach(p => {
        if (p.completed_at) {
          progressMap.set(p.micro_module_id, true);
        }
      });

      // Map modules to their indices and check progress
      modulesData?.forEach(module => {
        const key = `${module.topic_index}-${module.subtopic_index}-${module.module_index}`;
        progress[key] = progressMap.has(module.id);
      });

      setUserProgress(progress);
      
      // Cache for 5 minutes
      cacheManager.set(progressCacheKey, progress, 5 * 60 * 1000);

      // Set up real-time subscription for this course progress
      const progressChannel = supabase
        .channel(`course-${courseId}-progress-cached`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_micro_progress',
            filter: `course_id=eq.${courseId}`
          },
          (payload) => {
            console.log('🔄 Progress updated in real-time, invalidating cache:', payload);
            cacheManager.delete(progressCacheKey);
            fetchUserProgress(courseId, true);
          }
        )
        .subscribe();

      // Clean up previous subscription and store new one
      return () => {
        supabase.removeChannel(progressChannel);
      };

    } catch (error) {
      console.error('Failed to fetch user progress:', error);
    }
  }, [user]);

  const markModuleComplete = useCallback(async (
    courseId: string, 
    topicIndex: number, 
    subtopicIndex: number, 
    moduleIndex: number,
    quizScore: number = 0,
    timeSpent: number = 0
  ) => {
    if (!user) return;

    try {
      // First, find the micro_module_id based on the indices
      const { data: moduleData, error: moduleError } = await supabase
        .from('micro_modules')
        .select('id')
        .eq('course_id', courseId)
        .eq('topic_index', topicIndex)
        .eq('subtopic_index', subtopicIndex)
        .eq('module_index', moduleIndex)
        .single();

      if (moduleError) throw moduleError;

      const now = new Date().toISOString();
      const masteryLevel = quizScore >= 80 ? 100 : quizScore >= 60 ? 75 : 50;

      const { error } = await supabase
        .from('user_micro_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          micro_module_id: moduleData.id,
          completed_at: now,
          quiz_score: quizScore,
          time_spent_seconds: timeSpent,
          mastery_level: masteryLevel,
          attempts: 1,
          updated_at: now
        }, {
          onConflict: 'user_id,course_id,micro_module_id'
        });

      if (error) throw error;

      // Also insert learning analytics data
      await supabase
        .from('learning_analytics')
        .insert({
          user_id: user.id,
          course_id: courseId,
          micro_module_id: moduleData.id,
          session_id: crypto.randomUUID(),
          reading_time_seconds: timeSpent,
          engagement_score: quizScore >= 80 ? 0.9 : quizScore >= 60 ? 0.7 : 0.5,
          interaction_count: 1,
          comprehension_indicators: {
            quiz_score: quizScore,
            completion_time: timeSpent,
            mastery_achieved: quizScore >= 80
          }
        });

      const key = `${topicIndex}-${subtopicIndex}-${moduleIndex}`;
      setUserProgress(prev => ({ ...prev, [key]: true }));
      
      // Invalidate progress cache
      const progressCacheKey = CACHE_KEYS.USER_PROGRESS(courseId, user.id);
      cacheManager.delete(progressCacheKey);
      
      toast.success('Module completed! 🎉', {
        description: `Great job! ${quizScore > 0 ? `Quiz score: ${quizScore}%` : 'Keep up the great work!'}`
      });

    } catch (error) {
      console.error('Failed to mark module complete:', error);
      toast.error('Failed to save progress');
    }
  }, [user]);

  const getModuleProgress = useCallback((
    topicIndex: number, 
    subtopicIndex: number, 
    moduleIndex: number
  ): boolean => {
    const key = `${topicIndex}-${subtopicIndex}-${moduleIndex}`;
    return userProgress[key] || false;
  }, [userProgress]);

  const getCourseProgress = useCallback((course: Course): number => {
    let totalModules = 0;
    let completedModules = 0;
    
    course.topics.forEach((topic, topicIndex) => {
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        totalModules += subtopic.micro_modules.length;
        completedModules += subtopic.micro_modules.filter((_, moduleIndex) =>
          getModuleProgress(topicIndex, subtopicIndex, moduleIndex)
        ).length;
      });
    });
    
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  }, [getModuleProgress]);

  const cleanupOldGenerationSessions = useCallback(async () => {
    if (!user) return;

    try {
      // Cancel any old active generation sessions for this user
      const { data: oldSessions, error } = await supabase
        .from('generation_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active')
        .lt('last_activity', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // 2 hours ago
        .select();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Failed to cleanup old sessions:', error);
      } else if (oldSessions && oldSessions.length > 0) {
        console.log(`🧹 Cleaned up ${oldSessions.length} old generation sessions`);
        toast.info(`Cleaned up ${oldSessions.length} abandoned course generation sessions`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old generation sessions:', error);
    }
  }, [user]);

  // Set up real-time subscription for courses with cache invalidation
  useEffect(() => {
    if (user) {
      fetchCourses();
      cleanupOldGenerationSessions();

      // Subscribe to course updates
      const coursesChannel = supabase
        .channel('user-courses-enhanced')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'courses',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('🔄 Courses updated, invalidating cache and refetching...');
            const cacheKey = CACHE_KEYS.COURSES(user.id);
            cacheManager.delete(cacheKey);
            fetchCourses(true);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(coursesChannel);
      };
    }
  }, [user, fetchCourses, cleanupOldGenerationSessions]);

  return {
    courses,
    userProgress,
    loading,
    fetchCourses,
    fetchUserProgress,
    markModuleComplete,
    getModuleProgress,
    getCourseProgress,
    cleanupOldGenerationSessions
  };
}
