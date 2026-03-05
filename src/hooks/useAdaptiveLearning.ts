
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { performanceCache } from '@/utils/performanceCache';

interface LearningStyleProfile {
  id: string;
  user_id: string;
  content_preferences: {
    visual: number;
    auditory: number;
    kinesthetic: number;
  };
  pacing_preference: 'slow' | 'moderate' | 'fast';
  difficulty_preference: 'easy' | 'moderate' | 'challenging' | 'adaptive';
  optimal_session_duration: number;
  preferred_learning_times: string[];
  learning_style_scores: Record<string, number>;
  detected_patterns: Record<string, any>;
  confidence_score: number;
}

interface LearningPrediction {
  id: string;
  prediction_type: string;
  predicted_value: any;
  confidence_score: number;
  factors_considered: string[];
  prediction_horizon: string;
  expires_at: string;
}

interface AdaptiveRecommendation {
  type: 'difficulty' | 'pacing' | 'content_format' | 'learning_path';
  adjustment: any;
  reason: string;
  confidence: number;
}

// Helper function to safely parse JSONB data from Supabase
const parseJsonField = <T>(jsonField: any, fallback: T): T => {
  if (!jsonField) return fallback;
  if (typeof jsonField === 'string') {
    try {
      return JSON.parse(jsonField);
    } catch {
      return fallback;
    }
  }
  return jsonField as T;
};

// Helper function to transform database row to LearningStyleProfile
const transformToLearningProfile = (data: any): LearningStyleProfile => {
  return {
    id: data.id,
    user_id: data.user_id,
    content_preferences: parseJsonField(data.content_preferences, { visual: 0.33, auditory: 0.33, kinesthetic: 0.34 }),
    pacing_preference: data.pacing_preference as 'slow' | 'moderate' | 'fast',
    difficulty_preference: data.difficulty_preference as 'easy' | 'moderate' | 'challenging' | 'adaptive',
    optimal_session_duration: data.optimal_session_duration,
    preferred_learning_times: parseJsonField(data.preferred_learning_times, []),
    learning_style_scores: parseJsonField(data.learning_style_scores, {}),
    detected_patterns: parseJsonField(data.detected_patterns, {}),
    confidence_score: data.confidence_score
  };
};

// Helper function to transform database row to LearningPrediction
const transformToLearningPrediction = (data: any): LearningPrediction => {
  return {
    id: data.id,
    prediction_type: data.prediction_type,
    predicted_value: parseJsonField(data.predicted_value, {}),
    confidence_score: data.confidence_score,
    factors_considered: parseJsonField(data.factors_considered, []),
    prediction_horizon: data.prediction_horizon,
    expires_at: data.expires_at
  };
};

export function useAdaptiveLearning(courseId: string) {
  const { user } = useAuth();
  const [learningProfile, setLearningProfile] = useState<LearningStyleProfile | null>(null);
  const [predictions, setPredictions] = useState<LearningPrediction[]>([]);
  const [recommendations, setRecommendations] = useState<AdaptiveRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's learning style profile
  const fetchLearningProfile = useCallback(async () => {
    if (!user) return;

    const cacheKey = `learning_profile_${user.id}`;
    const cached = performanceCache.get<LearningStyleProfile>(cacheKey);
    if (cached) {
      setLearningProfile(cached);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('learning_style_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching learning profile:', error);
        return;
      }

      if (data) {
        const transformedProfile = transformToLearningProfile(data);
        setLearningProfile(transformedProfile);
        performanceCache.set(cacheKey, transformedProfile, 30 * 60 * 1000); // 30 minutes
      } else {
        // Create default profile
        await createDefaultLearningProfile();
      }
    } catch (error) {
      console.error('Unexpected error fetching learning profile:', error);
    }
  }, [user]);

  // Create default learning profile for new users
  const createDefaultLearningProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('learning_style_profiles')
        .insert({
          user_id: user.id,
          content_preferences: { visual: 0.33, auditory: 0.33, kinesthetic: 0.34 },
          pacing_preference: 'moderate',
          difficulty_preference: 'adaptive',
          optimal_session_duration: 30,
          preferred_learning_times: [],
          learning_style_scores: {},
          detected_patterns: {},
          confidence_score: 0.5
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        const transformedProfile = transformToLearningProfile(data);
        setLearningProfile(transformedProfile);
        const cacheKey = `learning_profile_${user.id}`;
        performanceCache.set(cacheKey, transformedProfile, 30 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error creating learning profile:', error);
    }
  }, [user]);

  // Fetch learning predictions
  const fetchPredictions = useCallback(async () => {
    if (!user || !courseId) return;

    try {
      const { data, error } = await supabase
        .from('learning_predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .gt('expires_at', new Date().toISOString())
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      
      const transformedPredictions = (data || []).map(transformToLearningPrediction);
      setPredictions(transformedPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  }, [user, courseId]);

  // Generate adaptive recommendations
  const generateRecommendations = useCallback(async () => {
    if (!user || !courseId || !learningProfile) return;

    try {
      // Fetch user's recent progress and analytics
      const { data: progressData } = await supabase
        .from('user_micro_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('updated_at', { ascending: false })
        .limit(10);

      const { data: analyticsData } = await supabase
        .from('enhanced_learning_analytics')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Analyze patterns and generate recommendations
      const newRecommendations: AdaptiveRecommendation[] = [];

      // Difficulty adjustment based on performance
      if (progressData && progressData.length > 0) {
        const avgScore = progressData.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / progressData.length;
        
        if (avgScore > 85 && learningProfile.difficulty_preference === 'adaptive') {
          newRecommendations.push({
            type: 'difficulty',
            adjustment: { level: 'increase', factor: 1.2 },
            reason: 'High performance detected - increasing difficulty to maintain engagement',
            confidence: 0.8
          });
        } else if (avgScore < 60 && learningProfile.difficulty_preference === 'adaptive') {
          newRecommendations.push({
            type: 'difficulty',
            adjustment: { level: 'decrease', factor: 0.8 },
            reason: 'Struggling performance detected - reducing difficulty for better comprehension',
            confidence: 0.9
          });
        }
      }

      // Pacing adjustment based on time patterns
      if (analyticsData && analyticsData.length > 0) {
        const avgTimeSpent = analyticsData.reduce((sum: number, a) => {
          if (!a || !a.time_spent_sections) return sum;
          
          const timeData = parseJsonField(a.time_spent_sections, {});
          if (!timeData || typeof timeData !== 'object') return sum;
          
          const timeSum = Object.values(timeData).reduce((t: number, s: unknown) => {
            return t + (typeof s === 'number' ? s : 0);
          }, 0) as number;
          return sum + timeSum;
        }, 0) / analyticsData.length;

        if (avgTimeSpent > learningProfile.optimal_session_duration * 60 * 1.5) {
          newRecommendations.push({
            type: 'pacing',
            adjustment: { speed: 'slower', breakFrequency: 'increase' },
            reason: 'Extended session times detected - suggesting more frequent breaks',
            confidence: 0.7
          });
        }
      }

      // Content format recommendations based on preferences
      const visualPreference = learningProfile.content_preferences.visual;
      if (visualPreference > 0.5) {
        newRecommendations.push({
          type: 'content_format',
          adjustment: { format: 'visual', emphasis: 'diagrams_and_charts' },
          reason: 'Visual learning preference detected - emphasizing visual content',
          confidence: visualPreference
        });
      }

      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }
  }, [user, courseId, learningProfile]);

  // Update learning profile based on new data
  const updateLearningProfile = useCallback(async (updates: Partial<LearningStyleProfile>) => {
    if (!user || !learningProfile) return;

    try {
      const { data, error } = await supabase
        .from('learning_style_profiles')
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq('id', learningProfile.id)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        const transformedProfile = transformToLearningProfile(data);
        setLearningProfile(transformedProfile);
        const cacheKey = `learning_profile_${user.id}`;
        performanceCache.set(cacheKey, transformedProfile, 30 * 60 * 1000);
      }
    } catch (error) {
      console.error('Error updating learning profile:', error);
    }
  }, [user, learningProfile]);

  // Log content adjustment
  const logContentAdjustment = useCallback(async (
    microModuleId: string,
    adjustmentType: string,
    originalValue: any,
    adjustedValue: any,
    reason: string,
    confidence: number
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('adaptive_content_adjustments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          micro_module_id: microModuleId,
          adjustment_type: adjustmentType,
          original_value: originalValue,
          adjusted_value: adjustedValue,
          reason,
          ai_confidence: confidence
        });
    } catch (error) {
      console.error('Error logging content adjustment:', error);
    }
  }, [user, courseId]);

  // Initialize data
  useEffect(() => {
    if (user && courseId) {
      setLoading(true);
      Promise.all([
        fetchLearningProfile(),
        fetchPredictions()
      ]).finally(() => setLoading(false));
    }
  }, [user, courseId, fetchLearningProfile, fetchPredictions]);

  // Generate recommendations when profile changes
  useEffect(() => {
    if (learningProfile) {
      generateRecommendations();
    }
  }, [learningProfile, generateRecommendations]);

  return {
    learningProfile,
    predictions,
    recommendations,
    loading,
    updateLearningProfile,
    logContentAdjustment,
    refreshData: () => {
      fetchLearningProfile();
      fetchPredictions();
    }
  };
}
