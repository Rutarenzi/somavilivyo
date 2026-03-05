
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { performanceCache, PERF_CACHE_KEYS } from '@/utils/performanceCache';

interface MicroModule {
  id: string;
  title: string;
  content: string;
  learning_objective: string;
  topic_index: number;
  subtopic_index: number;
  module_index: number;
  estimated_duration_minutes: number;
  quick_quiz?: any;
  generated_code?: string; // JSON string for dynamic rendering
}

interface UserProgress {
  id: string;
  micro_module_id: string;
  completed_at: string | null;
  quiz_score?: number;
  mastery_level?: number;
}

export function useCachedMicroModules(courseId: string) {
  const { user } = useAuth();
  const [microModules, setMicroModules] = useState<MicroModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentModule = microModules[currentModuleIndex];

  // Optimized fetch with smart caching
  const fetchMicroModules = useCallback(async (forceRefresh = false) => {
    if (!courseId || courseId === ':courseId') {
      console.error('❌ Invalid courseId provided to useCachedMicroModules:', courseId);
      setLoading(false);
      return;
    }

    console.log('🔍 useCachedMicroModules called with courseId:', courseId);

    const modulesCacheKey = PERF_CACHE_KEYS.COURSE_DETAIL(courseId);
    const progressCacheKey = user ? `${courseId}_${user.id}_progress` : null;

    // Try cache first for instant loading
    if (!forceRefresh) {
      const cachedModules = performanceCache.get<MicroModule[]>(modulesCacheKey);
      const cachedProgress = progressCacheKey ? performanceCache.get<UserProgress[]>(progressCacheKey) : null;
      
      if (cachedModules && cachedProgress) {
        console.log('📦 Loading micro-modules from cache (instant)');
        setMicroModules(cachedModules);
        setUserProgress(cachedProgress);
        return;
      }
    }

    setLoading(true);
    try {
      console.log('🔄 Fetching micro-modules from database for courseId:', courseId);
      
      // Optimized parallel queries
      const [modulesResult, progressResult] = await Promise.all([
        supabase
          .from('micro_modules')
          .select('id, title, content, learning_objective, topic_index, subtopic_index, module_index, estimated_duration_minutes, quick_quiz, generated_code')
          .eq('course_id', courseId)
          .order('topic_index')
          .order('subtopic_index')
          .order('module_index'),
        
        user ? supabase
          .from('user_micro_progress')
          .select('id, micro_module_id, completed_at, quiz_score, mastery_level')
          .eq('user_id', user.id)
          .eq('course_id', courseId) : Promise.resolve({ data: [], error: null })
      ]);

      if (modulesResult.error) throw modulesResult.error;
      if (progressResult.error) throw progressResult.error;

      const modulesData = modulesResult.data || [];
      const progressData = progressResult.data || [];

      setMicroModules(modulesData);
      setUserProgress(progressData);

      // Cache with shorter TTL for frequent access
      performanceCache.set(modulesCacheKey, modulesData, 10 * 60 * 1000); // 10 minutes
      if (progressCacheKey) {
        performanceCache.set(progressCacheKey, progressData, 5 * 60 * 1000); // 5 minutes
      }

    } catch (error) {
      console.error('Failed to fetch micro modules:', error);
      toast.error('Failed to load course modules');
    } finally {
      setLoading(false);
    }
  }, [courseId, user]);

  const completeModule = useCallback(async (moduleId: string, quizScore: number = 0, timeSpent: number = 0) => {
    if (!user) return false;

    try {
      const now = new Date().toISOString();
      const masteryLevel = quizScore >= 80 ? 100 : quizScore >= 60 ? 75 : 50;

      const { error } = await supabase
        .from('user_micro_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          micro_module_id: moduleId,
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

      // Update local progress state
      setUserProgress(prev => {
        const existing = prev.find(p => p.micro_module_id === moduleId);
        if (existing) {
          return prev.map(p => p.micro_module_id === moduleId 
            ? { ...p, completed_at: now, quiz_score: quizScore } 
            : p
          );
        }
        return [...prev, {
          id: crypto.randomUUID(),
          micro_module_id: moduleId,
          completed_at: now,
          quiz_score: quizScore,
          mastery_level: masteryLevel
        }];
      });

      // Invalidate progress cache
      const progressCacheKey = `${courseId}_${user.id}_progress`;
      performanceCache.invalidatePattern(progressCacheKey);
      
      toast.success('Module completed! 🎉');
      return true;

    } catch (error) {
      console.error('Failed to complete module:', error);
      toast.error('Failed to save progress');
      return false;
    }
  }, [user, courseId]);

  const jumpToModule = useCallback((index: number) => {
    if (index >= 0 && index < microModules.length) {
      setCurrentModuleIndex(index);
      // Cache current position
      performanceCache.setImmediate(`current_module_${courseId}`, index);
    }
  }, [microModules.length, courseId]);

  const goToNextModule = useCallback(() => {
    if (currentModuleIndex < microModules.length - 1) {
      jumpToModule(currentModuleIndex + 1);
    }
  }, [currentModuleIndex, microModules.length, jumpToModule]);

  const goToPreviousModule = useCallback(() => {
    if (currentModuleIndex > 0) {
      jumpToModule(currentModuleIndex - 1);
    }
  }, [currentModuleIndex, jumpToModule]);

  const getProgressStats = useCallback(() => {
    const completedModules = userProgress.filter(p => p.completed_at).length;
    const totalModules = microModules.length;
    const averageScore = userProgress.length > 0 
      ? userProgress.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / userProgress.length 
      : 0;

    return {
      completedModules,
      totalModules,
      progressPercentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
      averageScore: Math.round(averageScore),
      currentModuleNumber: currentModuleIndex + 1
    };
  }, [microModules.length, userProgress, currentModuleIndex]);

  // Initialize with cached position
  useEffect(() => {
    if (microModules.length > 0) {
      const cachedPosition = performanceCache.getImmediate<number>(`current_module_${courseId}`);
      if (cachedPosition !== null && cachedPosition >= 0 && cachedPosition < microModules.length) {
        setCurrentModuleIndex(cachedPosition);
      }
    }
  }, [microModules.length, courseId]);

  // Fetch data on mount with immediate cache check
  useEffect(() => {
    fetchMicroModules();
  }, [fetchMicroModules]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    microModules,
    userProgress,
    currentModule,
    currentModuleIndex,
    loading,
    completeModule,
    goToNextModule,
    goToPreviousModule,
    jumpToModule,
    getProgressStats,
    refreshData: () => fetchMicroModules(true)
  }), [
    microModules,
    userProgress,
    currentModule,
    currentModuleIndex,
    loading,
    completeModule,
    goToNextModule,
    goToPreviousModule,
    jumpToModule,
    getProgressStats,
    fetchMicroModules
  ]);
}
