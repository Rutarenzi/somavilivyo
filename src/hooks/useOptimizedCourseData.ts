import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { performanceCache } from '@/utils/performanceCache';

interface OptimizedCourseData {
  course: any;
  microModules: any[];
  userProgress: any[];
  progressStats: {
    completedModules: number;
    totalModules: number;
    progressPercentage: number;
    averageScore: number;
  };
}

export function useOptimizedCourseData(courseId: string) {
  const { user } = useAuth();
  const [data, setData] = useState<OptimizedCourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Single optimized RPC call to fetch all course data
  const fetchOptimizedCourseData = useCallback(async () => {
    if (!courseId || courseId === ':courseId' || !user) {
      setLoading(false);
      return;
    }

    const cacheKey = `optimized_course_${courseId}_${user.id}`;
    
    // Try cache first for instant loading
    const cached = performanceCache.get<OptimizedCourseData>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Optimized parallel queries for best performance
      const [courseResult, modulesResult, progressResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, title, description, skill_area, difficulty_level, topics, status, category, learning_preferences')
          .eq('id', courseId)
          .single(),
        
        supabase
          .from('micro_modules')
          .select('id, title, content, learning_objective, topic_index, subtopic_index, module_index, estimated_duration_minutes, quick_quiz, generated_code')
          .eq('course_id', courseId)
          .order('topic_index')
          .order('subtopic_index')
          .order('module_index'),
        
        supabase
          .from('user_micro_progress')
          .select('id, micro_module_id, completed_at, quiz_score, mastery_level')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
      ]);

      if (courseResult.error) {
        console.error('Course fetch error:', courseResult.error);
        throw new Error('Course not found or access denied');
      }
      if (modulesResult.error) {
        console.error('Modules fetch error:', modulesResult.error);
        throw new Error('Failed to load course modules');
      }
      if (progressResult.error) {
        console.error('Progress fetch error:', progressResult.error);
        // Progress errors are non-fatal, continue with empty progress
      }

      const course = courseResult.data;
      const microModules = modulesResult.data || [];
      const userProgress = progressResult.data || [];

      // Handle case where course has no modules (incomplete generation)
      if (course && microModules.length === 0) {
        console.warn('Course found but no modules exist - possible incomplete generation');
        throw new Error('Course content is being generated. Please try again in a few minutes.');
      }

      // Calculate progress stats efficiently
      const completedModules = userProgress.filter(p => p.completed_at).length;
      const totalModules = microModules.length;
      const averageScore = userProgress.length > 0 
        ? Math.round(userProgress.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / userProgress.length)
        : 0;

      const optimizedData: OptimizedCourseData = {
        course,
        microModules,
        userProgress,
        progressStats: {
          completedModules,
          totalModules,
          progressPercentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
          averageScore
        }
      };

      setData(optimizedData);
      
      // Cache for 5 minutes
      performanceCache.set(cacheKey, optimizedData, 5 * 60 * 1000);

    } catch (error) {
      console.error('Failed to fetch optimized course data:', error);
      setError('Failed to load course data');
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  // Update progress optimistically
  const updateProgress = useCallback((moduleId: string, completed: boolean, quizScore?: number) => {
    if (!data || !user) return;

    setData(prev => {
      if (!prev) return prev;

      const newProgress = completed 
        ? [...prev.userProgress.filter(p => p.micro_module_id !== moduleId), {
            id: crypto.randomUUID(),
            micro_module_id: moduleId,
            completed_at: new Date().toISOString(),
            quiz_score: quizScore || 0,
            mastery_level: (quizScore || 0) >= 80 ? 100 : (quizScore || 0) >= 60 ? 75 : 50
          }]
        : prev.userProgress.filter(p => p.micro_module_id !== moduleId);

      const completedModules = newProgress.filter(p => p.completed_at).length;
      const totalModules = prev.microModules.length;
      const averageScore = newProgress.length > 0 
        ? Math.round(newProgress.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / newProgress.length)
        : 0;

      return {
        ...prev,
        userProgress: newProgress,
        progressStats: {
          completedModules,
          totalModules,
          progressPercentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
          averageScore
        }
      };
    });

    // Invalidate cache
    const cacheKey = `optimized_course_${courseId}_${user.id}`;
    performanceCache.invalidatePattern(cacheKey);
  }, [data, courseId, user]);

  useEffect(() => {
    fetchOptimizedCourseData();
  }, [fetchOptimizedCourseData]);

  return useMemo(() => ({
    course: data?.course || null,
    microModules: data?.microModules || [],
    userProgress: data?.userProgress || [],
    progressStats: data?.progressStats || {
      completedModules: 0,
      totalModules: 0,
      progressPercentage: 0,
      averageScore: 0
    },
    loading,
    error,
    updateProgress,
    refetch: fetchOptimizedCourseData
  }), [data, loading, error, updateProgress, fetchOptimizedCourseData]);
}