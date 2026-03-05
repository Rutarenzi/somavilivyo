import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { analyzeCourseQuizQuality, isGenericQuestion } from '@/utils/quizQualityUtils';
import { QuizQuestion, convertToQuizQuestion, convertToDatabaseQuiz } from '@/types/quiz';

interface RegenerationProgress {
  courseId: string;
  courseTitle: string;
  totalModules: number;
  processedModules: number;
  regeneratedQuestions: number;
  status: 'idle' | 'analyzing' | 'regenerating' | 'completed' | 'error';
}

export function useQuizRegeneration() {
  const [progress, setProgress] = useState<RegenerationProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const generateBetterQuiz = useCallback(async (
    moduleTitle: string,
    content: string,
    learningObjective: string,
    maxRetries: number = 3
  ): Promise<QuizQuestion | null> => {
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Attempting to generate quality quiz for ${moduleTitle} (attempt ${attempt + 1})`);
        
        // Use the existing generate-questions edge function with enhanced prompt
        const { data, error } = await supabase.functions.invoke('generate-questions', {
          body: {
            courseTitle: 'Quiz Quality Enhancement',
            selectedTopicsDetail: [],
            selectedModuleContents: [{
              id: 'temp',
              title: moduleTitle,
              content: content,
              learning_objective: learningObjective
            }],
            preferences: {
              numQuestions: 1,
              questionTypes: ['mcq'],
              difficulty: 'moderate'
            }
          }
        });

        if (error) {
          console.error(`Error on attempt ${attempt + 1}:`, error);
          continue;
        }
        
        if (!data.questions || data.questions.length === 0) {
          console.error(`No questions generated on attempt ${attempt + 1}`);
          continue;
        }

        const generatedQuestion = data.questions[0];
        
        // Convert to the format expected by micro_modules
        const newQuiz: QuizQuestion = {
          question: generatedQuestion.question,
          options: generatedQuestion.options || [],
          correct: generatedQuestion.correctAnswer || 0,
          explanation: generatedQuestion.explanation || ''
        };

        // Validate the new quiz quality
        if (!isGenericQuestion(newQuiz)) {
          console.log(`✅ High-quality quiz generated for ${moduleTitle} on attempt ${attempt + 1}`);
          return newQuiz;
        } else {
          console.log(`❌ Generated quiz for ${moduleTitle} is still generic on attempt ${attempt + 1}, retrying...`);
          // Continue to next attempt
        }

      } catch (error) {
        console.error(`Error generating quiz for ${moduleTitle} on attempt ${attempt + 1}:`, error);
      }
    }

    console.warn(`⚠️ Could not generate high-quality quiz for ${moduleTitle} after ${maxRetries} attempts`);
    return null;
  }, []);

  const regenerateQuizForModule = useCallback(async (moduleId: string) => {
    try {
      // Get module data
      const { data: module, error: fetchError } = await supabase
        .from('micro_modules')
        .select('id, title, content, learning_objective, quick_quiz')
        .eq('id', moduleId)
        .single();

      if (fetchError) throw fetchError;

      const currentQuiz = convertToQuizQuestion(module.quick_quiz as any);
      
      // Only regenerate if current quiz is generic or invalid
      if (!isGenericQuestion(currentQuiz)) {
        console.log(`Quiz for module ${moduleId} is already high quality, skipping`);
        return false; // No regeneration needed
      }

      console.log(`Regenerating quiz for module: ${module.title}`);

      // Generate better quiz with multiple attempts
      const newQuiz = await generateBetterQuiz(
        module.title,
        module.content,
        module.learning_objective,
        3 // Max 3 attempts
      );

      if (!newQuiz) {
        console.warn(`Failed to generate quality quiz for module ${moduleId}, creating fallback`);
        
        // Create a fallback question based on learning objective
        const fallbackQuiz: QuizQuestion = {
          question: `What is the main focus of this lesson on ${module.title}?`,
          options: [
            module.learning_objective || 'Understanding the key concepts',
            'Memorizing every detail',
            'Completing assignments quickly',
            'Moving to advanced topics'
          ],
          correct: 0,
          explanation: `This lesson focuses on: ${module.learning_objective || 'understanding the core concepts and practical applications'}`
        };
        
        // Validate fallback is not generic
        if (isGenericQuestion(fallbackQuiz)) {
          console.warn(`Even fallback quiz for module ${moduleId} is generic, skipping update`);
          return false;
        }
        
        // Use fallback
        const dbQuiz = convertToDatabaseQuiz(fallbackQuiz);
        const { error: updateError } = await supabase
          .from('micro_modules')
          .update({ quick_quiz: dbQuiz as any })
          .eq('id', moduleId);

        if (updateError) throw updateError;
        return true;
      }

      // Convert to database format and update the module
      const dbQuiz = convertToDatabaseQuiz(newQuiz);
      const { error: updateError } = await supabase
        .from('micro_modules')
        .update({ quick_quiz: dbQuiz as any })
        .eq('id', moduleId);

      if (updateError) throw updateError;

      console.log(`✅ Successfully regenerated quiz for module ${moduleId}`);
      return true; // Successfully regenerated

    } catch (error) {
      console.error(`Error regenerating quiz for module ${moduleId}:`, error);
      return false;
    }
  }, [generateBetterQuiz]);

  const regenerateQuizForCourse = useCallback(async (courseId: string) => {
    setIsRunning(true);
    
    try {
      // Get course info
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      setProgress({
        courseId,
        courseTitle: course.title,
        totalModules: 0,
        processedModules: 0,
        regeneratedQuestions: 0,
        status: 'analyzing'
      });

      // Analyze current quiz quality
      const analysis = await analyzeCourseQuizQuality(courseId);
      
      setProgress(prev => prev ? {
        ...prev,
        totalModules: analysis.modulesNeedingRegeneration.length,
        status: 'regenerating'
      } : null);

      if (analysis.modulesNeedingRegeneration.length === 0) {
        toast({
          title: "No Issues Found",
          description: "All quiz questions in this course are already high quality!",
        });
        
        setProgress(prev => prev ? { ...prev, status: 'completed' } : null);
        return;
      }

      let regeneratedCount = 0;

      // Process each module that needs regeneration
      for (let i = 0; i < analysis.modulesNeedingRegeneration.length; i++) {
        const moduleId = analysis.modulesNeedingRegeneration[i];
        
        const wasRegenerated = await regenerateQuizForModule(moduleId);
        if (wasRegenerated) {
          regeneratedCount++;
        }

        setProgress(prev => prev ? {
          ...prev,
          processedModules: i + 1,
          regeneratedQuestions: regeneratedCount
        } : null);

        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setProgress(prev => prev ? {
        ...prev,
        status: 'completed'
      } : null);

      toast({
        title: "Quiz Regeneration Complete! 🎉",
        description: `Successfully regenerated ${regeneratedCount} quiz questions out of ${analysis.modulesNeedingRegeneration.length} modules.`,
      });

    } catch (error: any) {
      console.error('Error regenerating quizzes:', error);
      
      setProgress(prev => prev ? {
        ...prev,
        status: 'error'
      } : null);

      toast({
        title: "Regeneration Failed",
        description: error.message || "An error occurred while regenerating quiz questions.",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  }, [regenerateQuizForModule, toast]);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    progress,
    isRunning,
    regenerateQuizForCourse,
    resetProgress
  };
}
