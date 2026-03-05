import { QuizQuestion } from "@/types/quiz";

// Generate content-specific fallback quiz templates based on topic
function getTopicSpecificQuizTemplate(title: string, objective?: string, moduleIndex?: number): { question: string; options: string[]; correct: number; explanation: string } {
  const titleLower = title.toLowerCase();
  const seed = moduleIndex || Math.floor(Math.random() * 10);
  
  // Machine Learning specific - multiple variations
  if (titleLower.includes('machine learning') || titleLower.includes('ml')) {
    const mlQuestions = [
      {
        question: "Which of the following best describes machine learning?",
        options: [
          "A subset of AI that enables computers to learn from data without explicit programming",
          "A programming language used for creating websites", 
          "A database management system",
          "A type of computer hardware"
        ],
        correct: 0,
        explanation: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed for each task."
      },
      {
        question: "What is the key difference between machine learning and traditional programming?",
        options: [
          "ML algorithms improve their performance through experience with data",
          "ML requires more human intervention at every step",
          "ML can only work with numerical data",
          "ML is faster than traditional programming"
        ],
        correct: 0,
        explanation: "Unlike traditional programming where rules are explicitly coded, machine learning algorithms improve their performance by learning patterns from data."
      },
      {
        question: "Which type of data is essential for machine learning algorithms?",
        options: [
          "Training data with examples and patterns",
          "Only text-based information",
          "Random numbers without structure",
          "Computer code snippets"
        ],
        correct: 0,
        explanation: "Machine learning algorithms require training data containing examples and patterns to learn from and make predictions."
      }
    ];
    return mlQuestions[seed % mlQuestions.length];
  }
  
  // Artificial Intelligence specific - multiple variations
  if (titleLower.includes('artificial intelligence') || titleLower.includes('ai')) {
    const aiQuestions = [
      {
        question: "What is the main characteristic of artificial intelligence systems?",
        options: [
          "They can simulate human intelligence and decision-making processes",
          "They only store large amounts of data",
          "They require constant human supervision", 
          "They can only perform simple calculations"
        ],
        correct: 0,
        explanation: "Artificial intelligence systems are designed to simulate human intelligence, including learning, reasoning, and decision-making capabilities."
      },
      {
        question: "Which of these is a common application of artificial intelligence?",
        options: [
          "Pattern recognition and automated decision making",
          "Only data storage and retrieval",
          "Manual data entry tasks",
          "Simple arithmetic calculations"
        ],
        correct: 0,
        explanation: "AI excels at pattern recognition and making automated decisions based on data analysis and learned patterns."
      },
      {
        question: "How does AI differ from regular computer programs?",
        options: [
          "AI can adapt and learn from new information",
          "AI programs are always smaller in size",
          "AI only works with specific file formats",
          "AI requires less computational power"
        ],
        correct: 0,
        explanation: "Unlike traditional programs with fixed instructions, AI systems can adapt and improve their performance by learning from new data."
      }
    ];
    return aiQuestions[seed % aiQuestions.length];
  }
  
  // Programming/Coding specific - multiple variations
  if (titleLower.includes('programming') || titleLower.includes('coding') || titleLower.includes('python') || titleLower.includes('javascript')) {
    const progQuestions = [
      {
        question: `What is a fundamental concept in ${title}?`,
        options: [
          "Writing clear, logical instructions for computers to execute",
          "Only designing colorful user interfaces",
          "Managing computer hardware components",
          "Creating databases without any logic"
        ],
        correct: 0,
        explanation: `${title} involves creating clear, logical instructions that computers can follow to solve problems and automate tasks.`
      },
      {
        question: `Which skill is most important when learning ${title}?`,
        options: [
          "Breaking complex problems into smaller, manageable steps",
          "Memorizing all programming syntax",
          "Working only with visual tools",
          "Avoiding any mathematical concepts"
        ],
        correct: 0,
        explanation: `Success in ${title} requires the ability to analyze complex problems and break them down into logical, step-by-step solutions.`
      }
    ];
    return progQuestions[seed % progQuestions.length];
  }
  
  // Data Science specific - multiple variations
  if (titleLower.includes('data science') || titleLower.includes('data analysis')) {
    const dsQuestions = [
      {
        question: "What is the primary focus of data science?",
        options: [
          "Extracting insights and knowledge from structured and unstructured data",
          "Only creating charts and graphs",
          "Managing computer networks",
          "Designing websites"
        ],
        correct: 0,
        explanation: "Data science focuses on extracting meaningful insights and knowledge from data using various analytical and statistical methods."
      },
      {
        question: "Which process is essential in data science workflows?",
        options: [
          "Cleaning and preparing data for analysis",
          "Only collecting as much data as possible", 
          "Ignoring data quality issues",
          "Using only visual analysis tools"
        ],
        correct: 0,
        explanation: "Data cleaning and preparation is crucial in data science as raw data often contains errors, inconsistencies, and missing values."
      }
    ];
    return dsQuestions[seed % dsQuestions.length];
  }
  
  // Create objective-informed questions that are still knowledge-testing (avoid generic phrasing)
  if (objective && objective.trim().length > 10) {
    const cleanObjective = objective.replace(/students will be able to/i, '').trim();
    const objectiveQuestions = [
      {
        question: `Which outcome best demonstrates mastery for this module?`,
        options: [
          cleanObjective,
          "Recite unrelated facts from memory",
          "Ignore applying the concept",
          "Focus only on terminology without understanding"
        ],
        correct: 0,
        explanation: `This module targets: ${cleanObjective}.`
      },
      {
        question: `What result aligns with the stated learning goal?`,
        options: [
          cleanObjective,
          "Memorize definitions only",
          "Avoid practical tasks",
          "Skip core ideas and context"
        ],
        correct: 0,
        explanation: `The correct outcome reflects the goal: ${cleanObjective}.`
      }
    ];
    return objectiveQuestions[seed % objectiveQuestions.length];
  }
  
  // Generic fallback with variation
  const genericQuestions = [
    {
      question: `What is an important aspect when studying ${title}?`,
      options: [
        "Understanding the core concepts and their practical applications",
        "Only memorizing facts without context",
        "Avoiding hands-on practice", 
        "Skipping the foundational principles"
      ],
      correct: 0,
      explanation: `Effective learning in ${title} requires understanding core concepts and seeing how they apply in real-world situations.`
    },
    {
      question: `Which approach is most effective for mastering ${title}?`,
      options: [
        "Combining theoretical knowledge with practical application",
        "Only reading without any practice",
        "Memorizing without understanding",
        "Skipping difficult concepts"
      ],
      correct: 0,
      explanation: `The best way to master ${title} is to combine theoretical understanding with hands-on practice and real-world application.`
    }
  ];
  
  return genericQuestions[seed % genericQuestions.length];
}

// Generate a safe fallback quiz when module data has no valid quiz
export function generateFallbackQuiz(title: string, objective?: string, variationKey?: string): QuizQuestion {
  // Create a simple hash from title + objective + variationKey to ensure consistent but unique questions per module
  const contentHash = title + (objective || '') + (variationKey || '');
  const moduleIndex = contentHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return getTopicSpecificQuizTemplate(title, objective, moduleIndex);
}

// Normalize various quiz shapes into a valid QuizQuestion or return a fallback
export function getValidQuiz(quizData: any, title: string, objective?: string, variationKey?: string): QuizQuestion | null {
  // If nothing was provided, respect original behavior (no quiz)
  if (quizData === null || quizData === undefined) return null;

  let src = Array.isArray(quizData) ? quizData[0] : quizData;

  if (src && typeof src === 'object') {
    const question = src.question || src.prompt || '';
    const options = src.options || src.choices || src.answers;
    let correct = src.correct ?? src.correctAnswerIndex ?? src.answer ?? src.correctAnswer;

    if (typeof correct === 'string') {
      const parsed = parseInt(correct, 10);
      if (!isNaN(parsed)) correct = parsed;
    }

    if (
      question &&
      Array.isArray(options) &&
      options.length > 0 &&
      typeof correct === 'number' &&
      correct >= 0 &&
      correct < options.length
    ) {
      return {
        question,
        options,
        correct,
        explanation: src.explanation || '',
      };
    }
  }

  // If something was provided but invalid (e.g., empty array, malformed object), provide a safe fallback
  return generateFallbackQuiz(title, objective, variationKey);
}
