
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  skill?: string;
  purpose?: string;
  motivation?: string;
  currentLevel?: string | number;
  dailyTime?: string;
  learningStyle?: string;
  pace?: string;
  problemToSolve?: string;
  currentKnowledge?: string;
  relatedSkills?: string;
  toolsUsed?: string;
  theoryVsPractice?: string;
  daysPerWeek?: string;
  finalProject?: string;
  successDefinition?: string;
  // Enhanced fields
  age?: string;
  educationalBackground?: string;
  courseLength?: string;
  questionsPerModule?: number;
  // CBC Personalization fields
  purposeDrivenLearning?: string;
  learningStylePreferences?: string[];
  pacingPreference?: string;
  emotionalMentalState?: string;
  toneStyle?: string;
  presentationStyle?: string;
  contentTypePreferences?: string[];
  [key: string]: any;
}

export const useCourseGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const generateCourse = async (formData: FormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a course.",
        variant: "destructive",
      });
      return null;
    }

    // Enhanced validation for new required fields
    if (!formData.skill || formData.skill.trim() === '') {
      toast({
        title: "Missing Information",
        description: "Please provide the skill you want to learn.",
        variant: "destructive",
      });
      return null;
    }

    if (!formData.age) {
      toast({
        title: "Missing Information", 
        description: "Please select your age range for age-appropriate content.",
        variant: "destructive",
      });
      return null;
    }

    if (!formData.educationalBackground) {
      toast({
        title: "Missing Information",
        description: "Please select your educational background to optimize content complexity.",
        variant: "destructive",
      });
      return null;
    }

    if (!formData.courseLength) {
      toast({
        title: "Missing Information",
        description: "Please select your preferred course length.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    setProgress(0);
    const startTime = Date.now();
    
    try {
      console.log('🚀 Enhanced course generation with parallel processing:', formData);
      
      setCurrentPhase('Initializing enhanced generation system...');
      setProgress(15);
      
      setCurrentPhase('Generating professional course title...');
      setProgress(25);
      
      setCurrentPhase('Processing with 20 parallel API calls...');
      setProgress(40);
      
      // Call the course generation edge function (now returns session)
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          userId: user.id,
          formData: formData
        }
      });

      if (error) {
        console.error('Course generation error:', error);
        toast({
          title: "Course Generation Failed",
          description: error.message || "Failed to start course generation. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      if (!data.success || !data.sessionId) {
        throw new Error(data.error || 'Failed to create generation session');
      }

      setCurrentPhase('Generation started in background...');
      setProgress(50);

      console.log('✅ Generation session created:', data.sessionId);
      
      // Store session ID and redirect to progress page
      const sessionId = data.sessionId;

      // Update user profile with enhanced learning preferences
      const enhancedPreferences = {
        ...formData,
        lastGenerationDate: new Date().toISOString(),
        enhancedFeaturesUsed: true,
        parallelProcessingEnabled: true
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          learning_preferences: enhancedPreferences,
          onboarding_completed: true,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail the whole process for profile update errors
      }

      setProgress(100);

      toast({
        title: "🚀 Course Generation Started!",
        description: "Your course is being generated in the background. You'll be redirected to track progress.",
      });

      // Return session info instead of course
      return { sessionId, isBackground: true };
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating your course. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
      setCurrentPhase('');
      setProgress(0);
    }
  };

  return { generateCourse, loading, progress, currentPhase };
};
