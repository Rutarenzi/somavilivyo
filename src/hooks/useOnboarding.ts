import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OnboardingState {
  showLearnerTypeModal: boolean;
  showStudentSetup: boolean;
  loading: boolean;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<OnboardingState>({
    showLearnerTypeModal: false,
    showStudentSetup: false,
    loading: false
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('learner_type, onboarding_completed, country_id, current_education_level_id')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      if (!profile?.onboarding_completed) {
        setState(prev => ({ ...prev, showLearnerTypeModal: true }));
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const handleLearnerTypeSelection = async (learnerType: 'student' | 'passionate') => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Update user profile with learner type
      const { error } = await supabase
        .from('profiles')
        .update({ 
          learner_type: learnerType,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        showLearnerTypeModal: false,
        showStudentSetup: learnerType === 'student',
        loading: false
      }));

      if (learnerType === 'passionate') {
        // Complete onboarding for passionate learners
        await completeOnboarding();
      }

      // Refresh profile data
      await refreshOnboarding();

    } catch (error) {
      console.error('Error updating learner type:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleStudentSetupComplete = async (data: { countryId: string; educationLevelId: string }) => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          country_id: data.countryId,
          current_education_level_id: data.educationLevelId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await completeOnboarding();
      await refreshOnboarding();

    } catch (error) {
      console.error('Error completing student setup:', error);
      toast({
        title: "Error",
        description: "Failed to save your educational background. Please try again.",
        variant: "destructive",
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setState({
        showLearnerTypeModal: false,
        showStudentSetup: false,
        loading: false
      });

      toast({
        title: "Welcome! 🎉",
        description: "Your profile has been set up successfully. Let's start learning!",
      });

    } catch (error) {
      console.error('Error completing onboarding:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const skipOnboarding = async () => {
    await completeOnboarding();
    await refreshOnboarding();
  };

  // Function to refresh onboarding data (can be called from other components)
  const refreshOnboarding = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('learner_type, onboarding_completed, country_id, current_education_level_id')
      .eq('id', user.id)
      .single();

    setUserProfile(profile);
  };

  return {
    ...state,
    userProfile,
    handleLearnerTypeSelection,
    handleStudentSetupComplete,
    skipOnboarding,
    refreshOnboarding
  };
};