
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { INITIAL_STATE } from './phased/phasedGenerationConstants';
import type { PhasedGenerationState, ToastOptions } from './phased/types';
import { orchestratePhasedGeneration } from './phased/phasedGenerationOrchestrator';
import { useBackgroundGeneration } from './useBackgroundGeneration';

export const usePhasedGenerationManager = () => {
  const [state, setState] = useState<PhasedGenerationState>(INITIAL_STATE);
  const { user } = useAuth();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { startBackgroundGeneration } = useBackgroundGeneration();

  const updateState = useCallback((updates: Partial<PhasedGenerationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const getAbortSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  // Wrapper for the toast function to be passed to the orchestrator
  const wrappedToastForOrchestrator = useCallback((options: ToastOptions) => {
    const { title, description, variant, duration } = options;
    let mappedVariant: 'default' | 'destructive' = 'default';
    if (variant === 'destructive') {
      mappedVariant = 'destructive';
    }
    toast({
      title,
      description,
      variant: mappedVariant,
      duration,
    });
  }, [toast]);

  const generateCourse = useCallback(async (formData: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a course.",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Starting course generation with formData:', formData);

    // Validate required fields for initial generation
    if (!formData.phase && (!formData.skill || !formData.age || !formData.educationalBackground || !formData.courseLength)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (skill, age, education, course length).",
        variant: "destructive",
      });
      return;
    }

    abortControllerRef.current = new AbortController();

    // Determine if this is continuing an existing session or starting fresh
    const isInitialGeneration = !formData.phase;
    
    if (isInitialGeneration) {
      updateState({
        ...INITIAL_STATE,
        formData,
        isActive: true,
        currentPhase: 'Initializing course generation...',
        progress: 5,
        totalPhases: 4 // Set total phases
      });
    } else {
      // Continue with existing session data but update phase
      updateState({
        isActive: true,
        currentPhase: `Starting ${formData.phase} generation...`,
        progress: state.progress // Keep existing progress
      });
    }

    try {
      const generatedCourse = await orchestratePhasedGeneration(
        user,
        formData,
        updateState,
        wrappedToastForOrchestrator,
        getAbortSignal
      );
      
      // If generation completes, offer to start background generation for future robustness
      if (generatedCourse && state.sessionId) {
        console.log('🎯 Course generation completed, considering background processing for future...');
      }
      
      console.log('✅ Course generation completed successfully:', generatedCourse);
      return generatedCourse;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred during course generation.';
      console.error("[usePhasedGenerationManager] Error calling orchestratePhasedGeneration:", error);
      
      if (abortControllerRef.current?.signal.aborted || errorMessage === "GENERATION_ABORTED_BY_USER") {
        updateState({
          isActive: false,
          error: 'Course generation was cancelled by the user.',
          currentPhase: 'Generation Cancelled'
        });
        toast({
          title: "Generation Cancelled",
          description: "Course generation process was stopped.",
          variant: "default",
        });
      } else {
        updateState({
          isActive: false,
          error: errorMessage,
          currentPhase: 'Generation failed'
        });
        toast({
          title: "Course Generation Failed",
          description: errorMessage,
          variant: "destructive",
          duration: 10000,
        });
      }
    }
  }, [user, toast, updateState, getAbortSignal, wrappedToastForOrchestrator, state.progress]);

  const cancelGeneration = useCallback(async () => {
    console.log("[usePhasedGenerationManager] cancelGeneration called");
    if (abortControllerRef.current) {
      console.log("[usePhasedGenerationManager] Aborting current generation controller");
      abortControllerRef.current.abort(); 
    }
  
    if (state.sessionId) {
      try {
        console.log(`[usePhasedGenerationManager] Updating session ${state.sessionId} to cancelled`);
        supabase
          .from('generation_sessions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            error_message: 'User cancelled generation via UI.'
          })
          .eq('id', state.sessionId)
          .eq('status', 'active')
          .then(({ error: cancelError }) => {
            if (cancelError) {
              console.error(`[usePhasedGenerationManager] Failed to update session ${state.sessionId} to cancelled in DB:`, cancelError);
              toast({ title: "Cancellation Info", description: "Attempted to mark session as cancelled. Process stopped.", variant: "default" });
            } else {
              console.log(`[usePhasedGenerationManager] Session ${state.sessionId} marked as cancelled in DB by manager.`);
            }
          });
      } catch (error) {
        console.error('[usePhasedGenerationManager] Error in cancelGeneration while updating session:', error);
        toast({ title: "Cancellation Error", description: "Could not update session status in database.", variant: "destructive" });
      }
    }

    updateState({
      isActive: false,
      currentPhase: 'Generation cancelled by user.',
      error: null, 
    });
    
    toast({
      title: "Generation Cancelled",
      description: "Course generation has been stopped.",
      variant: "default"
    });
  }, [state.sessionId, updateState, toast]);

  const resetGeneration = useCallback(() => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
    }
    setState(INITIAL_STATE);
    console.log("[usePhasedGenerationManager] Generation state reset.");
  }, []);

  return {
    state,
    generateCourse,
    cancelGeneration,
    resetGeneration,
    loading: state.isActive
  };
};
