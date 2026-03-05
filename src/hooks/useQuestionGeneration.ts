import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { Course } from './useCourses'; // Assuming Course type is available
import { MicroModule } from './useMicroModules'; // Assuming MicroModule type

// Matches the structure from the edge function
export interface GeneratedQuestion {
  question: string;
  type: 'mcq' | 'true_false';
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
}

export interface QuestionGenerationPreferences {
  numQuestions: number;
  questionTypes: string[];
  difficulty: string;
  focusAreas?: string[];
}

// For saving to the question_sets table
export interface QuestionSetRecord {
  course_id: string;
  selected_course_title: string;
  selected_topics_json: any; 
  selected_module_ids: string[];
  generation_preferences: QuestionGenerationPreferences;
  generated_questions: GeneratedQuestion[];
}

// For displaying fetched question sets
export interface FetchedQuestionSet {
  id: string;
  user_id: string;
  course_id: string;
  selected_course_title: string | null;
  selected_topics_json: any;
  selected_module_ids: string[] | null;
  generation_preferences: QuestionGenerationPreferences;
  generated_questions: GeneratedQuestion[];
  created_at: string;
  updated_at: string;
}

interface UseQuestionGenerationReturn {
  generatedQuestions: GeneratedQuestion[] | null;
  isLoading: boolean;
  error: string | null;
  generateQuestions: (
    course: Course,
    selectedTopicsDetail: Array<{ topic_index: number; title: string; selected_subtopics: Array<{ subtopic_index: number; title: string }> }>,
    selectedModules: MicroModule[],
    preferences: QuestionGenerationPreferences
  ) => Promise<GeneratedQuestion[] | null>;
  saveQuestionSet: (data: QuestionSetRecord) => Promise<string | null>; 
  fetchedQuestionSets: FetchedQuestionSet[];
  isLoadingSets: boolean;
  errorSets: string | null;
  fetchQuestionSets: () => Promise<void>;
  deleteQuestionSet: (setId: string) => Promise<void>;
}

const getModuleDisplayTitle = (module: { title: string; learning_objective?: string | null }): string => {
  const isGenericTitle = /^Module \d+$/i.test(module.title.trim());
  if (isGenericTitle && module.learning_objective && module.learning_objective.trim() !== "") {
    return module.learning_objective;
  }
  return module.title;
};

export const useQuestionGeneration = (): UseQuestionGenerationReturn => {
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [fetchedQuestionSets, setFetchedQuestionSets] = useState<FetchedQuestionSet[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [errorSets, setErrorSets] = useState<string | null>(null);

  const generateQuestions = async (
    course: Course,
    selectedTopicsDetail: Array<{ topic_index: number; title: string; selected_subtopics: Array<{ subtopic_index: number; title: string }> }>,
    selectedModules: MicroModule[],
    preferences: QuestionGenerationPreferences
  ): Promise<GeneratedQuestion[] | null> => {
    if (!user?.id) {
      const errorMessage = "You must be logged in to generate questions.";
      setError(errorMessage);
      toast({ title: "Authentication Required", description: errorMessage, variant: "destructive" });
      return null;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedQuestions(null);

    const selectedModuleContents = selectedModules.map(m => ({
      id: m.id,
      title: getModuleDisplayTitle(m), // Use display title
      content: m.content,
      learning_objective: m.learning_objective, // Keep original learning objective if needed by AI separately
    }));

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-questions', {
        body: {
          userId: user.id, // CRITICAL: Pass user ID for token tracking
          courseTitle: course.title,
          selectedTopicsDetail,
          selectedModuleContents, // This now contains improved titles
          preferences: {
            questionTypes: preferences.questionTypes,
            difficulty: preferences.difficulty,
            focusAreas: preferences.focusAreas,
            questionsPerModule: preferences.numQuestions || 10, // Pass the number from preferences
          },
        },
      });

      if (functionError) throw new Error(functionError.message);
      if (data.error) throw new Error(data.error);
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("AI did not return questions in the expected format.");
      }
      
      setGeneratedQuestions(data.questions);
      setIsLoading(false);
      toast({ title: "Questions Generated!", description: `Successfully generated ${data.questions.length} questions.` });
      return data.questions;

    } catch (e: any) {
      console.error("Question generation error:", e);
      const errorMessage = e.message || "Failed to generate questions. Please try again.";
      setError(errorMessage);
      toast({ title: "Generation Error", description: errorMessage, variant: "destructive" });
      setIsLoading(false);
      return null;
    }
  };

  const fetchQuestionSets = useCallback(async () => {
    setIsLoadingSets(true);
    setErrorSets(null);
    try {
      const { data, error: dbError } = await supabase
        .from('question_sets')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      // Cast to unknown first, then to FetchedQuestionSet[] to satisfy TypeScript
      // This assumes the data structure from Supabase matches FetchedQuestionSet at runtime.
      setFetchedQuestionSets((data as unknown as FetchedQuestionSet[]) || []);
    } catch (e: any) {
      console.error("Error fetching question sets:", e);
      const errorMessage = e.message || "Failed to fetch question sets.";
      setErrorSets(errorMessage);
      toast({ title: "Fetch Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingSets(false);
    }
  }, [toast]);

  const saveQuestionSet = async (setData: QuestionSetRecord): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('question_sets')
        .insert({
          ...setData,
          // Ensure correct casting for JSONB fields if Supabase client needs it
          selected_topics_json: setData.selected_topics_json as any, 
          generation_preferences: setData.generation_preferences as any,
          generated_questions: setData.generated_questions as any,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;
      
      toast({ title: "Question Set Saved!", description: "Your generated questions have been saved." });
      await fetchQuestionSets(); // Refetch sets after saving
      return data?.id || null;

    } catch (e: any) {
      console.error("Error saving question set:", e);
      const errorMessage = e.message || "Failed to save question set.";
      setError(errorMessage);
      toast({ title: "Save Error", description: errorMessage, variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuestionSet = async (setId: string): Promise<void> => {
    if (!user?.id) {
      const errorMessage = "You must be logged in to delete question sets.";
      setError(errorMessage);
      toast({ title: "Authentication Required", description: errorMessage, variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log(`Deleting question set: ${setId} for user: ${user.id}`);
      
      const { error: dbError } = await supabase
        .from('question_sets')
        .delete()
        .eq('id', setId)
        .eq('user_id', user.id); // Ensure user can only delete their own sets

      if (dbError) {
        console.error("Supabase deletion error:", dbError);
        throw dbError;
      }

      toast({ title: "Question Set Deleted", description: "The question set has been removed." });
      await fetchQuestionSets(); // Refetch sets after deleting
    } catch (e: any) {
      console.error("Error deleting question set:", e);
      const errorMessage = e.message || "Failed to delete question set.";
      setError(errorMessage);
      toast({ title: "Delete Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatedQuestions,
    isLoading,
    error,
    generateQuestions,
    saveQuestionSet,
    fetchedQuestionSets,
    isLoadingSets,
    errorSets,
    fetchQuestionSets,
    deleteQuestionSet,
  };
};
