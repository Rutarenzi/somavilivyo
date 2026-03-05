import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeManager } from './useRealtimeManager';

export interface LearningInsight {
  id: string;
  user_id: string;
  course_id: string;
  insight_type: string;
  title: string;
  description: string;
  priority: number;
  action_items: string[];
  confidence_score: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface CompetencyTracking {
  id: string;
  user_id: string;
  course_id: string;
  competency_name: string;
  current_level: string;
  mastery_percentage: number;
  evidence_points: string[];
  skill_gaps: string[];
  improvement_suggestions: string[];
  last_assessed_at: string;
  created_at: string;
  updated_at: string;
}

export const useLearningInsights = (courseId: string) => {
  const { user } = useAuth();
  const { subscribe } = useRealtimeManager();
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyTracking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    if (!user || !courseId) return;

    try {
      // Fetch learning insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('learning_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (insightsError) throw insightsError;

      // Fetch competency tracking
      const { data: competenciesData, error: competenciesError } = await supabase
        .from('competency_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .order('mastery_percentage', { ascending: false });

      if (competenciesError) throw competenciesError;

      // Transform insights data to match our interface
      const transformedInsights: LearningInsight[] = (insightsData || []).map(insight => ({
        ...insight,
        action_items: Array.isArray(insight.action_items) ? insight.action_items as string[] : []
      }));

      // Transform competencies data to match our interface
      const transformedCompetencies: CompetencyTracking[] = (competenciesData || []).map(comp => ({
        ...comp,
        evidence_points: Array.isArray(comp.evidence_points) ? comp.evidence_points as string[] : [],
        skill_gaps: Array.isArray(comp.skill_gaps) ? comp.skill_gaps as string[] : [],
        improvement_suggestions: Array.isArray(comp.improvement_suggestions) ? comp.improvement_suggestions as string[] : []
      }));

      setInsights(transformedInsights);
      setCompetencies(transformedCompetencies);

      // If no insights exist, generate some based on user progress
      if (!transformedInsights || transformedInsights.length === 0) {
        await generateInitialInsights();
      }

      // If no competencies exist, generate initial ones
      if (!transformedCompetencies || transformedCompetencies.length === 0) {
        await generateInitialCompetencies();
      }

    } catch (error) {
      console.error('Error fetching learning insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInitialInsights = async () => {
    if (!user || !courseId) return;

    try {
      // Get user progress to generate insights
      const { data: progress, error: progressError } = await supabase
        .from('user_micro_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      const completedModules = progress?.filter(p => p.completed_at).length || 0;
      const averageScore = progress?.length > 0 
        ? progress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / progress.length 
        : 0;

      const insightsToCreate = [];

      // Generate insights based on progress
      if (completedModules === 0) {
        insightsToCreate.push({
          user_id: user.id,
          course_id: courseId,
          insight_type: 'recommendation',
          title: 'Ready to Start Learning',
          description: 'Welcome to your course! Start with the first module to begin your learning journey.',
          priority: 5,
          action_items: ['Click on the first module to get started', 'Review the course overview', 'Set your learning goals'],
          confidence_score: 1.0,
          is_active: true
        });
      } else if (completedModules > 0 && completedModules < 5) {
        insightsToCreate.push({
          user_id: user.id,
          course_id: courseId,
          insight_type: 'strength',
          title: 'Great Start!',
          description: `You've completed ${completedModules} modules. Keep up the momentum!`,
          priority: 3,
          action_items: ['Continue with the next module', 'Review previous concepts if needed'],
          confidence_score: 0.9,
          is_active: true
        });
      }

      if (averageScore < 70 && progress && progress.length > 0) {
        insightsToCreate.push({
          user_id: user.id,
          course_id: courseId,
          insight_type: 'weakness',
          title: 'Focus on Understanding',
          description: `Your average quiz score is ${Math.round(averageScore)}%. Consider reviewing the material more thoroughly.`,
          priority: 4,
          action_items: ['Review module content before taking quizzes', 'Take notes while learning', 'Re-attempt challenging modules'],
          confidence_score: 0.8,
          is_active: true
        });
      } else if (averageScore >= 85 && progress && progress.length > 0) {
        insightsToCreate.push({
          user_id: user.id,
          course_id: courseId,
          insight_type: 'strength',
          title: 'Excellent Performance',
          description: `Outstanding! Your average quiz score is ${Math.round(averageScore)}%. You're mastering the material well.`,
          priority: 2,
          action_items: ['Consider helping other learners', 'Challenge yourself with advanced topics'],
          confidence_score: 0.95,
          is_active: true
        });
      }

      // Insert insights
      if (insightsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('learning_insights')
          .insert(insightsToCreate);

        if (insertError) throw insertError;

        // Refresh insights
        setTimeout(fetchInsights, 500);
      }

    } catch (error) {
      console.error('Error generating initial insights:', error);
    }
  };

  const generateInitialCompetencies = async () => {
    if (!user || !courseId) return;

    try {
      // Get course information to determine competencies
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Get user progress for mastery calculation
      const { data: progress, error: progressError } = await supabase
        .from('user_micro_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      const competenciesToCreate = [];
      const skillArea = course?.skill_area || 'General Learning';
      const completedModules = progress?.filter(p => p.completed_at).length || 0;
      
      // Calculate total modules from course topics
      let totalModules = 0;
      if (course?.topics && Array.isArray(course.topics)) {
        const topics = course.topics as any[];
        totalModules = topics.reduce((total: number, topic: any) => 
          total + (topic.subtopics?.reduce((subtotal: number, subtopic: any) => 
            subtotal + (subtopic.micro_modules?.length || 0), 0) || 0), 0);
      }

      const masteryPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
      const averageScore = progress?.length > 0 
        ? progress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / progress.length 
        : 0;

      // Determine current level based on progress and scores
      let currentLevel = 'beginner';
      if (masteryPercentage >= 80 && averageScore >= 85) {
        currentLevel = 'expert';
      } else if (masteryPercentage >= 60 && averageScore >= 75) {
        currentLevel = 'advanced';
      } else if (masteryPercentage >= 30 && averageScore >= 65) {
        currentLevel = 'intermediate';
      }

      // Generate skill gaps based on performance
      const skillGaps = [];
      if (averageScore < 70) skillGaps.push('Quiz Performance');
      if (masteryPercentage < 50) skillGaps.push('Course Completion');
      if (completedModules === 0) skillGaps.push('Getting Started');

      competenciesToCreate.push({
        user_id: user.id,
        course_id: courseId,
        competency_name: skillArea,
        current_level: currentLevel,
        mastery_percentage: Math.round(masteryPercentage),
        evidence_points: [
          `Completed ${completedModules} out of ${totalModules} modules`,
          `Average quiz score: ${Math.round(averageScore)}%`
        ],
        skill_gaps: skillGaps,
        improvement_suggestions: skillGaps.length > 0 ? [
          'Continue with consistent daily practice',
          'Review challenging concepts',
          'Complete remaining modules'
        ] : [
          'Explore advanced topics',
          'Share knowledge with others'
        ],
        last_assessed_at: new Date().toISOString()
      });

      if (competenciesToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('competency_tracking')
          .insert(competenciesToCreate);

        if (insertError) throw insertError;

        // Refresh competencies
        setTimeout(fetchInsights, 500);
      }

    } catch (error) {
      console.error('Error generating initial competencies:', error);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    await generateInitialInsights();
    await generateInitialCompetencies();
    await fetchInsights();
  };

  // Set up real-time subscriptions using centralized manager
  useEffect(() => {
    fetchInsights();

    if (!user || !courseId) return;

    const insightsSubscriberId = `insights-${courseId}-${user.id}`;
    const competencySubscriberId = `competency-${courseId}-${user.id}`;

    const unsubscribeInsights = subscribe(insightsSubscriberId, {
      table: 'learning_insights',
      filter: `user_id=eq.${user.id}`,
      event: '*',
      callback: () => {
        fetchInsights();
      }
    });

    const unsubscribeCompetency = subscribe(competencySubscriberId, {
      table: 'competency_tracking',
      filter: `user_id=eq.${user.id}`,
      event: '*',
      callback: () => {
        fetchInsights();
      }
    });

    return () => {
      unsubscribeInsights();
      unsubscribeCompetency();
    };
  }, [user, courseId, subscribe]);

  return {
    insights,
    competencies,
    loading,
    refetch: fetchInsights,
    generateInsights
  };
};
