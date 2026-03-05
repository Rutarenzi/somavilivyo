
import { supabase } from '@/integrations/supabase/client';
import { QuizQuestion, convertToQuizQuestion } from '@/types/quiz';

// Patterns that indicate low-quality or generic questions
const GENERIC_QUESTION_PATTERNS = [
  /what is covered in.*\?\?/i,
  /what does.*module.*cover/i,
  /which.*following.*covered/i,
  /what.*main.*topic/i,
  /what.*primary.*goal/i,
  /what.*primary.*focus/i,
  /what is the primary goal of.*\?/i,
  /to develop.*understanding/i,
  /to develop.*able to/i
];

const GENERIC_OPTION_PATTERNS = [
  /all.*above/i,
  /none.*above/i,
  /basic.*concepts/i,
  /advanced.*topics/i,
  /fundamental.*principles/i,
  /core concepts/i,
  /further details/i,
  /related examples/i
];

/**
 * Checks if a quiz question is generic or low-quality
 */
export function isGenericQuestion(question: QuizQuestion | null): boolean {
  if (!question || !question.question || !question.options) {
    return true; // Consider null/invalid questions as generic
  }

  // Check if question text matches generic patterns
  const hasGenericQuestion = GENERIC_QUESTION_PATTERNS.some(pattern => 
    pattern.test(question.question)
  );

  // Check if options are too generic
  const genericOptionsCount = question.options.filter(option =>
    GENERIC_OPTION_PATTERNS.some(pattern => pattern.test(option))
  ).length;

  // Check for placeholder-like content
  const hasPlaceholders = question.question.includes('??') || 
    question.question.includes('[') || 
    question.question.includes(']');

  // Check if all options are suspiciously similar in length or structure
  const avgOptionLength = question.options.reduce((sum, opt) => sum + opt.length, 0) / question.options.length;
  const similarLengthOptions = question.options.filter(opt => 
    Math.abs(opt.length - avgOptionLength) < 5
  ).length;

  return hasGenericQuestion || 
         genericOptionsCount >= 2 || 
         hasPlaceholders || 
         similarLengthOptions === question.options.length;
}

/**
 * Analyzes the quality of quiz questions in a course
 */
export async function analyzeCourseQuizQuality(courseId: string) {
  try {
    const { data: modules, error } = await supabase
      .from('micro_modules')
      .select('id, title, content, learning_objective, quick_quiz')
      .eq('course_id', courseId);

    if (error) throw error;

    const analysis = {
      totalModules: modules?.length || 0,
      modulesWithQuiz: 0,
      genericQuestions: 0,
      qualityQuestions: 0,
      modulesNeedingRegeneration: [] as string[]
    };

    modules?.forEach(module => {
      if (module.quick_quiz && typeof module.quick_quiz === 'object') {
        const quiz = convertToQuizQuestion(module.quick_quiz);
        if (quiz) {
          analysis.modulesWithQuiz++;

          if (isGenericQuestion(quiz)) {
            analysis.genericQuestions++;
            analysis.modulesNeedingRegeneration.push(module.id);
          } else {
            analysis.qualityQuestions++;
          }
        }
      }
    });

    return analysis;
  } catch (error) {
    console.error('Error analyzing quiz quality:', error);
    throw error;
  }
}

/**
 * Gets all courses that need quiz regeneration
 */
export async function getCoursesNeedingQuizRegeneration(userId: string) {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title, description')
      .eq('user_id', userId);

    if (error) throw error;

    const coursesNeedingFix = [];

    for (const course of courses || []) {
      const analysis = await analyzeCourseQuizQuality(course.id);
      if (analysis.genericQuestions > 0) {
        coursesNeedingFix.push({
          ...course,
          ...analysis
        });
      }
    }

    return coursesNeedingFix;
  } catch (error) {
    console.error('Error getting courses needing regeneration:', error);
    throw error;
  }
}
