
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { performanceCache, PERF_CACHE_KEYS } from '@/utils/performanceCache';

export interface MicroModule {
  id: string;
  subtopic_id: string;
  course_id: string;
  topic_index: number;
  subtopic_index: number;
  module_index: number;
  title: string;
  content: string;
  estimated_duration_minutes: number;
  learning_objective: string;
  quick_quiz: any;
  prerequisites: string[];
  created_at: string;
  generated_code?: string; // JSON string for dynamic rendering
}

export interface MicroProgress {
  id: string;
  user_id: string;
  course_id: string;
  micro_module_id: string;
  completed_at: string | null;
  quiz_score: number;
  time_spent_seconds: number;
  mastery_level: number;
  review_scheduled_at: string | null;
  attempts: number;
}

export const useMicroModules = (courseId: string) => {
  const [microModules, setMicroModules] = useState<MicroModule[]>([]);
  const [userProgress, setUserProgress] = useState<MicroProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMicroModules = async () => {
    if (!user || !courseId) return;

    try {
      // Check cache first for instant loading
      const modulesKey = `micro_modules_${courseId}`;
      const progressKey = PERF_CACHE_KEYS.PROGRESS_DATA(user.id, courseId);
      
      const cachedModules = performanceCache.get<any[]>(modulesKey);
      const cachedProgress = performanceCache.get<MicroProgress[]>(progressKey);
      
      if (cachedModules && cachedProgress) {
        console.log('📦 Loading micro-modules from cache (instant)');
        
        // Set cached data immediately
        const transformedModules: MicroModule[] = cachedModules.map((module: any) => ({
          ...module,
          prerequisites: Array.isArray(module.prerequisites) 
            ? module.prerequisites as string[]
            : module.prerequisites 
              ? [module.prerequisites as string]
              : []
        }));
        
        setMicroModules(transformedModules);
        setUserProgress(cachedProgress);
        
        // Set current module index
        const completedModuleIds = new Set(
          cachedProgress
            .filter((p: MicroProgress) => p.completed_at)
            .map((p: MicroProgress) => p.micro_module_id)
        );
        
        const firstIncompleteIndex = transformedModules.findIndex(
          module => !completedModuleIds.has(module.id)
        );
        
        setCurrentModuleIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
        setLoading(false);
        
        // Background refresh for fresh data
        setTimeout(() => fetchFreshData(), 100);
        return;
      }
      
      // Fallback to fresh fetch if not cached
      await fetchFreshData();
      
    } catch (error) {
      console.error('Unexpected error fetching micro-modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    if (!user || !courseId) return;
    
    try {
      // Fetch micro-modules
      const { data: modules, error: modulesError } = await supabase
        .from('micro_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('topic_index', { ascending: true })
        .order('subtopic_index', { ascending: true })
        .order('module_index', { ascending: true });

      if (modulesError) {
        console.error('Error fetching micro-modules:', modulesError);
        return;
      }

      // Fetch user progress
      const { data: progress, error: progressError } = await supabase
        .from('user_micro_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
        return;
      }
      
      // Cache the fresh data
      const modulesKey = `micro_modules_${courseId}`;
      const progressKey = PERF_CACHE_KEYS.PROGRESS_DATA(user.id, courseId);
      
      performanceCache.set(modulesKey, modules || [], 25 * 60 * 1000);
      performanceCache.set(progressKey, progress || [], 20 * 60 * 1000);

      // Transform modules data to match MicroModule interface
      const transformedModules: MicroModule[] = (modules || []).map(module => ({
        ...module,
        prerequisites: Array.isArray(module.prerequisites) 
          ? module.prerequisites as string[]
          : module.prerequisites 
            ? [module.prerequisites as string]
            : []
      }));

      setMicroModules(transformedModules);
      setUserProgress(progress || []);

      // Set current module to first incomplete module
      const completedModuleIds = new Set(
        (progress || [])
          .filter(p => p.completed_at)
          .map(p => p.micro_module_id)
      );

      const firstIncompleteIndex = transformedModules.findIndex(
        module => !completedModuleIds.has(module.id)
      );

      setCurrentModuleIndex(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);
    } catch (error) {
      console.error('Unexpected error fetching micro-modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeModule = async (moduleId: string, quizScore: number, timeSpent: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_micro_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          micro_module_id: moduleId,
          completed_at: new Date().toISOString(),
          quiz_score: quizScore,
          time_spent_seconds: timeSpent,
          mastery_level: quizScore >= 80 ? 100 : 50,
          attempts: 1
        });

      if (error) {
        console.error('Error completing module:', error);
        return false;
      }

      // Update local state
      setUserProgress(prev => {
        const existing = prev.find(p => p.micro_module_id === moduleId);
        if (existing) {
          return prev.map(p => 
            p.micro_module_id === moduleId 
              ? { ...p, completed_at: new Date().toISOString(), quiz_score: quizScore }
              : p
          );
        } else {
          return [...prev, {
            id: '',
            user_id: user.id,
            course_id: courseId,
            micro_module_id: moduleId,
            completed_at: new Date().toISOString(),
            quiz_score: quizScore,
            time_spent_seconds: timeSpent,
            mastery_level: quizScore >= 80 ? 100 : 50,
            review_scheduled_at: null,
            attempts: 1
          }];
        }
      });

      toast({
        title: "Micro-Module Completed! 🎉",
        description: `Great job! You've mastered another piece of knowledge.`,
      });

      return true;
    } catch (error) {
      console.error('Error completing module:', error);
      return false;
    }
  };

  const getNextModule = () => {
    if (currentModuleIndex < microModules.length - 1) {
      return microModules[currentModuleIndex + 1];
    }
    return null;
  };

  const getPreviousModule = () => {
    if (currentModuleIndex > 0) {
      return microModules[currentModuleIndex - 1];
    }
    return null;
  };

  const goToNextModule = () => {
    if (currentModuleIndex < microModules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    }
  };

  const goToPreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
    }
  };

  const jumpToModule = (index: number) => {
    if (index >= 0 && index < microModules.length) {
      setCurrentModuleIndex(index);
    }
  };

  const getProgressStats = () => {
    const totalModules = microModules.length;
    const completedModules = userProgress.filter(p => p.completed_at).length;
    const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    
    return {
      totalModules,
      completedModules,
      progressPercentage: Math.round(progressPercentage),
      currentModuleNumber: currentModuleIndex + 1
    };
  };

  useEffect(() => {
    fetchMicroModules();
  }, [user, courseId]);

  return {
    microModules,
    userProgress,
    loading,
    currentModuleIndex,
    currentModule: microModules[currentModuleIndex],
    completeModule,
    getNextModule,
    getPreviousModule,
    goToNextModule,
    goToPreviousModule,
    jumpToModule,
    getProgressStats,
    refetch: fetchMicroModules
  };
};
