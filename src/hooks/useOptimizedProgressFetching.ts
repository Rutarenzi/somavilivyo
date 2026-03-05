import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { performanceCache, PERF_CACHE_KEYS } from '@/utils/performanceCache';

interface ProgressStats {
  totalModules: number;
  completedModules: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  progressPercentage: number;
  weeklyProgress: Array<{
    week: string;
    completion: number;
    timeSpent: number;
    quizScore: number;
  }>;
  engagementData: Array<{
    date: string;
    engagement: number;
    modulesCompleted: number;
  }>;
}

interface UseOptimizedProgressFetchingProps {
  courseId: string;
  refreshInterval?: number;
  cacheTimeout?: number;
}

export const useOptimizedProgressFetching = ({
  courseId,
  refreshInterval = 300000, // 5 minutes
  cacheTimeout = 180000 // 3 minutes
}: UseOptimizedProgressFetchingProps) => {
  const { user } = useAuth();
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalModules: 0,
    completedModules: 0,
    averageQuizScore: 0,
    totalTimeSpent: 0,
    progressPercentage: 0,
    weeklyProgress: [],
    engagementData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const cacheKey = useMemo(() => 
    `analytics_${user?.id || ''}_${courseId}`, 
    [user?.id, courseId]
  );

  const fetchProgressData = useCallback(async (forceRefresh = false) => {
    if (!user || !courseId) return;

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedData = performanceCache.get<ProgressStats>(cacheKey);
      if (cachedData) {
        setProgressStats(cachedData);
        setLoading(false);
        return cachedData;
      }
    }

    try {
      setError(null);

      // Optimized parallel queries with specific field selection
      const [progressResult, analyticsResult, modulesResult] = await Promise.allSettled([
        supabase
          .from('user_micro_progress')
          .select('completed_at, quiz_score, time_spent_seconds')
          .eq('user_id', user.id)
          .eq('course_id', courseId),
        supabase
          .from('learning_analytics')
          .select('created_at, engagement_score')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })
          .limit(50), // Limit to recent data
        supabase
          .from('micro_modules')
          .select('id')
          .eq('course_id', courseId)
      ]);

      // Handle any failed queries
      if (progressResult.status === 'rejected' || 
          analyticsResult.status === 'rejected' || 
          modulesResult.status === 'rejected') {
        throw new Error('Failed to fetch some progress data');
      }

      const microProgress = progressResult.value.data || [];
      const analytics = analyticsResult.value.data || [];
      const modules = modulesResult.value.data || [];

      // Calculate optimized statistics
      const totalModules = modules.length;
      const completedModules = microProgress.filter(p => p.completed_at).length;
      const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
      
      const averageQuizScore = microProgress.length > 0 
        ? Math.round(microProgress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / microProgress.length)
        : 0;
      
      const totalTimeSpent = microProgress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);

      // Generate time-based data efficiently
      const weeklyProgress = generateWeeklyData(microProgress);
      const engagementData = generateEngagementData(analytics);

      const newStats: ProgressStats = {
        totalModules,
        completedModules,
        averageQuizScore,
        totalTimeSpent,
        progressPercentage: Math.round(progressPercentage),
        weeklyProgress,
        engagementData
      };

      setProgressStats(newStats);
      setLastFetched(new Date());
      
      // Cache with specified timeout
      performanceCache.set(cacheKey, newStats, cacheTimeout);
      
      return newStats;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch progress data';
      setError(errorMessage);
      console.error('Progress fetching error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, courseId, cacheKey, cacheTimeout]);

  // Optimized data generators
  const generateWeeklyData = useCallback((progressData: any[]) => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i * 7 + 7) * 24 * 60 * 60 * 1000);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekProgress = progressData.filter(p => {
        if (!p.completed_at) return false;
        const completedTime = new Date(p.completed_at).getTime();
        return completedTime >= weekStart.getTime() && completedTime < weekEnd.getTime();
      });

      const avgQuizScore = weekProgress.length > 0
        ? Math.round(weekProgress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / weekProgress.length)
        : 0;

      const totalTime = weekProgress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);

      weeks.push({
        week: `Week ${4 - i}`,
        completion: weekProgress.length,
        timeSpent: Math.round(totalTime / 60),
        quizScore: avgQuizScore
      });
    }
    
    return weeks;
  }, []);

  const generateEngagementData = useCallback((analyticsData: any[]) => {
    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      date.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayAnalytics = analyticsData.filter(a => {
        const createdTime = new Date(a.created_at).getTime();
        return createdTime >= date.getTime() && createdTime <= dayEnd.getTime();
      });

      const avgEngagement = dayAnalytics.length > 0
        ? dayAnalytics.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / dayAnalytics.length
        : 0;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        engagement: Math.round(avgEngagement * 100),
        modulesCompleted: dayAnalytics.filter(a => a.engagement_score && a.engagement_score > 0.8).length
      });
    }
    
    return last7Days;
  }, []);

  // Auto-refresh mechanism
  useEffect(() => {
    fetchProgressData();

    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchProgressData();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchProgressData, refreshInterval]);

  // Manual refresh function
  const refreshData = useCallback(() => {
    setLoading(true);
    return fetchProgressData(true);
  }, [fetchProgressData]);

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    performanceCache.invalidatePattern(cacheKey);
  }, [cacheKey]);

  return {
    progressStats,
    loading,
    error,
    lastFetched,
    refreshData,
    invalidateCache,
    fetchProgressData
  };
};