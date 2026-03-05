
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsSession {
  sessionId: string;
  startTime: number;
  readingPatterns: Record<string, any>;
  interactionPatterns: Record<string, any>;
  scrollBehavior: Record<string, any>;
  timeSpentSections: Record<string, number>;
  helpSeekingEvents: any[];
  confidenceRatings: Record<string, number>;
  struggleIndicators: any[];
}

export function useEnhancedAnalytics(courseId: string, microModuleId: string) {
  const { user } = useAuth();
  const [session, setSession] = useState<AnalyticsSession | null>(null);
  const scrollDataRef = useRef<{ lastPosition: number; lastTime: number; scrollEvents: any[] }>({
    lastPosition: 0,
    lastTime: 0,
    scrollEvents: []
  });
  const sectionTimersRef = useRef<Record<string, number>>({});

  // Initialize analytics session
  const initializeSession = useCallback(() => {
    if (!user || !courseId || !microModuleId) return;

    const newSession: AnalyticsSession = {
      sessionId: crypto.randomUUID(),
      startTime: Date.now(),
      readingPatterns: {},
      interactionPatterns: {},
      scrollBehavior: {},
      timeSpentSections: {},
      helpSeekingEvents: [],
      confidenceRatings: {},
      struggleIndicators: []
    };

    setSession(newSession);
    return newSession.sessionId;
  }, [user, courseId, microModuleId]);

  // Track scroll behavior
  const trackScrollBehavior = useCallback((scrollPosition: number, maxScroll: number) => {
    if (!session) return;

    const now = Date.now();
    const scrollData = scrollDataRef.current;
    
    const scrollSpeed = Math.abs(scrollPosition - scrollData.lastPosition) / Math.max(now - scrollData.lastTime, 1);
    
    scrollData.scrollEvents.push({
      position: scrollPosition,
      timestamp: now,
      speed: scrollSpeed,
      direction: scrollPosition > scrollData.lastPosition ? 'down' : 'up'
    });

    scrollData.lastPosition = scrollPosition;
    scrollData.lastTime = now;

    // Update session data
    setSession(prev => prev ? {
      ...prev,
      scrollBehavior: {
        events: scrollData.scrollEvents.slice(-50), // Keep last 50 events
        averageSpeed: scrollData.scrollEvents.reduce((sum, e) => sum + e.speed, 0) / scrollData.scrollEvents.length,
        maxPosition: Math.max(prev.scrollBehavior.maxPosition || 0, scrollPosition),
        progressPercentage: (scrollPosition / maxScroll) * 100
      }
    } : null);
  }, [session]);

  // Track time spent in sections
  const startSectionTimer = useCallback((sectionId: string) => {
    sectionTimersRef.current[sectionId] = Date.now();
  }, []);

  const endSectionTimer = useCallback((sectionId: string) => {
    const startTime = sectionTimersRef.current[sectionId];
    if (!startTime || !session) return;

    const timeSpent = Date.now() - startTime;
    
    setSession(prev => prev ? {
      ...prev,
      timeSpentSections: {
        ...prev.timeSpentSections,
        [sectionId]: (prev.timeSpentSections[sectionId] || 0) + timeSpent
      }
    } : null);

    delete sectionTimersRef.current[sectionId];
  }, [session]);

  // Track interactions (clicks, hovers, etc.)
  const trackInteraction = useCallback((type: string, target: string, data?: any) => {
    if (!session) return;

    setSession(prev => prev ? {
      ...prev,
      interactionPatterns: {
        ...prev.interactionPatterns,
        [type]: [...(prev.interactionPatterns[type] || []), {
          target,
          timestamp: Date.now(),
          data
        }]
      }
    } : null);
  }, [session]);

  // Track help-seeking behavior
  const trackHelpSeeking = useCallback((helpType: string, context: string, resolved: boolean = false) => {
    if (!session) return;

    const helpEvent = {
      type: helpType,
      context,
      timestamp: Date.now(),
      resolved
    };

    setSession(prev => prev ? {
      ...prev,
      helpSeekingEvents: [...prev.helpSeekingEvents, helpEvent]
    } : null);
  }, [session]);

  // Track confidence ratings
  const trackConfidence = useCallback((sectionId: string, rating: number) => {
    if (!session) return;

    setSession(prev => prev ? {
      ...prev,
      confidenceRatings: {
        ...prev.confidenceRatings,
        [sectionId]: rating
      }
    } : null);
  }, [session]);

  // Track struggle indicators
  const trackStruggleIndicator = useCallback((indicator: string, severity: number, context: any) => {
    if (!session) return;

    const struggleEvent = {
      indicator,
      severity,
      context,
      timestamp: Date.now()
    };

    setSession(prev => prev ? {
      ...prev,
      struggleIndicators: [...prev.struggleIndicators, struggleEvent]
    } : null);
  }, [session]);

  // Auto-detect reading patterns
  const detectReadingPatterns = useCallback(() => {
    if (!session) return;

    const scrollEvents = session.scrollBehavior.events || [];
    const timeSpent = Object.values(session.timeSpentSections);
    
    // Detect reading speed
    const avgTimePerSection = timeSpent.length > 0 ? 
      timeSpent.reduce((sum, time) => sum + time, 0) / timeSpent.length : 0;
    
    // Detect scroll patterns
    const rapidScrolls = scrollEvents.filter(e => e.speed > 100).length;
    const pausePoints = scrollEvents.filter((e, i) => 
      i > 0 && e.speed < 10 && scrollEvents[i-1].speed > 50
    ).length;

    const patterns = {
      readingSpeed: avgTimePerSection < 30000 ? 'fast' : avgTimePerSection > 120000 ? 'slow' : 'normal',
      scrollPattern: rapidScrolls > scrollEvents.length * 0.3 ? 'skimming' : 'thorough',
      pauseFrequency: pausePoints / scrollEvents.length,
      engagementLevel: session.interactionPatterns ? Object.keys(session.interactionPatterns).length : 0
    };

    setSession(prev => prev ? {
      ...prev,
      readingPatterns: patterns
    } : null);
  }, [session]);

  // Save analytics data to database
  const saveAnalyticsData = useCallback(async () => {
    if (!session || !user) return;

    try {
      await supabase
        .from('enhanced_learning_analytics')
        .insert({
          user_id: user.id,
          course_id: courseId,
          micro_module_id: microModuleId,
          session_id: session.sessionId,
          reading_patterns: session.readingPatterns,
          interaction_patterns: session.interactionPatterns,
          scroll_behavior: session.scrollBehavior,
          time_spent_sections: session.timeSpentSections,
          help_seeking_events: session.helpSeekingEvents,
          confidence_ratings: session.confidenceRatings,
          struggle_indicators: session.struggleIndicators,
          attention_span_minutes: Math.round((Date.now() - session.startTime) / 60000)
        });

      console.log('Analytics data saved successfully');
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }, [session, user, courseId, microModuleId]);

  // Auto-detect patterns periodically
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      detectReadingPatterns();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [session, detectReadingPatterns]);

  // Auto-save data periodically
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      saveAnalyticsData();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [session, saveAnalyticsData]);

  // Save data when component unmounts
  useEffect(() => {
    return () => {
      if (session) {
        saveAnalyticsData();
      }
    };
  }, [session, saveAnalyticsData]);

  return {
    sessionId: session?.sessionId,
    initializeSession,
    trackScrollBehavior,
    startSectionTimer,
    endSectionTimer,
    trackInteraction,
    trackHelpSeeking,
    trackConfidence,
    trackStruggleIndicator,
    saveAnalyticsData,
    session
  };
}
