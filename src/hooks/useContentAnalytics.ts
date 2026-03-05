
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsData {
  readingTime: number;
  scrollProgress: number;
  interactionCount: number;
  pauseCount: number;
  replayCount: number;
  sessionId: string;
}

export const useContentAnalytics = (courseId: string, moduleId: string) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    readingTime: 0,
    scrollProgress: 0,
    interactionCount: 0,
    pauseCount: 0,
    replayCount: 0,
    sessionId: crypto.randomUUID()
  });

  const [startTime] = useState(Date.now());
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Track reading time
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setAnalytics(prev => ({
          ...prev,
          readingTime: prev.readingTime + 1
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > lastScrollPosition) {
        setLastScrollPosition(scrollPercent);
        setAnalytics(prev => ({
          ...prev,
          scrollProgress: Math.max(prev.scrollProgress, scrollPercent),
          interactionCount: prev.interactionCount + 1
        }));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollPosition]);

  // Track pause/resume
  const trackPause = useCallback(() => {
    setIsPaused(true);
    setAnalytics(prev => ({
      ...prev,
      pauseCount: prev.pauseCount + 1
    }));
  }, []);

  const trackResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const trackReplay = useCallback(() => {
    setAnalytics(prev => ({
      ...prev,
      replayCount: prev.replayCount + 1,
      interactionCount: prev.interactionCount + 1
    }));
  }, []);

  const trackInteraction = useCallback(() => {
    setAnalytics(prev => ({
      ...prev,
      interactionCount: prev.interactionCount + 1
    }));
  }, []);

  // Save analytics to database
  const saveAnalytics = useCallback(async () => {
    if (!user || !courseId || !moduleId) return;

    const engagementScore = Math.min(100, 
      (analytics.scrollProgress * 0.4) + 
      (Math.min(analytics.readingTime / 60, 10) * 6) + 
      (Math.min(analytics.interactionCount, 20) * 2)
    );

    const comprehensionIndicators = {
      timeOnContent: analytics.readingTime,
      engagementLevel: analytics.interactionCount > 5 ? 'high' : analytics.interactionCount > 2 ? 'medium' : 'low',
      completionIndicator: analytics.scrollProgress > 80 ? 'completed' : 'partial',
      focusLevel: analytics.pauseCount < 3 ? 'high' : 'medium'
    };

    try {
      await supabase.from('learning_analytics').upsert({
        user_id: user.id,
        course_id: courseId,
        micro_module_id: moduleId,
        session_id: analytics.sessionId,
        reading_time_seconds: analytics.readingTime,
        scroll_progress: analytics.scrollProgress,
        interaction_count: analytics.interactionCount,
        pause_count: analytics.pauseCount,
        replay_count: analytics.replayCount,
        engagement_score: engagementScore,
        comprehension_indicators: comprehensionIndicators,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }, [user, courseId, moduleId, analytics]);

  // Auto-save analytics periodically
  useEffect(() => {
    const interval = setInterval(saveAnalytics, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [saveAnalytics]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveAnalytics();
    };
  }, [saveAnalytics]);

  return {
    analytics,
    trackPause,
    trackResume,
    trackReplay,
    trackInteraction,
    saveAnalytics
  };
};
