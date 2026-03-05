
// Shared quiz type definitions
export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}

// Database-compatible quiz type
export interface DatabaseQuiz {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  [key: string]: any; // Allow additional properties for database compatibility
}

// Type guard to check if an object is a valid quiz question
export function isValidQuizQuestion(obj: any): obj is QuizQuestion {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.question === 'string' &&
    Array.isArray(obj.options) &&
    typeof obj.correct === 'number' &&
    obj.options.length > 0 &&
    obj.correct >= 0 &&
    obj.correct < obj.options.length
  );
}

// Convert database quiz to QuizQuestion
export function convertToQuizQuestion(dbQuiz: any): QuizQuestion | null {
  if (!isValidQuizQuestion(dbQuiz)) {
    return null;
  }
  
  return {
    question: dbQuiz.question,
    options: dbQuiz.options,
    correct: dbQuiz.correct,
    explanation: dbQuiz.explanation || ''
  };
}

// Convert QuizQuestion to database format
export function convertToDatabaseQuiz(quiz: QuizQuestion): DatabaseQuiz {
  return {
    question: quiz.question,
    options: quiz.options,
    correct: quiz.correct,
    explanation: quiz.explanation || ''
  };
}
