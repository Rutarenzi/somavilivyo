import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get all available API keys from environment variables
const getApiKeys = (): string[] => {
  const keys: string[] = [];
  const baseKey = Deno.env.get("GOOGLE_API_KEY");
  if (baseKey) keys.push(baseKey);

  for (let i = 2; i <= 20; i++) {
    const key = Deno.env.get(`GOOGLE_API_KEY_${i}`);
    if (key) keys.push(key);
  }
  console.log(`Found ${keys.length} Google API keys.`);
  return keys;
};

// Generate comprehensive content for modules that have empty or inadequate content
async function generateComprehensiveContent(microModule: any, supabase: any): Promise<any> {
  // Check if the module already has quality content
  if (microModule.content && typeof microModule.content === 'object') {
    // Check for comprehensive content structure
    if (microModule.content.mainContent && 
        microModule.content.mainContent.length > 200 && 
        microModule.content.keyPoints && 
        microModule.content.quickQuiz) {
      console.log(`Module ${microModule.title} already has comprehensive content`);
      return microModule.content;
    }
  }

  // Generate comprehensive content for this module
  console.log(`Generating comprehensive content for module: ${microModule.title}`);
  
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    console.warn('No Google API keys available, using minimal fallback content');
    return createMinimalContent(microModule);
  }

  const systemInstruction = `You are an advanced educational content AI specialized in creating comprehensive learning materials.

CRITICAL CONTENT GENERATION REQUIREMENTS:
1. Create substantial, high-quality educational content (minimum 300 words for mainContent)
2. Include specific, concrete examples and practical applications
3. Generate content-specific quiz questions that test actual understanding
4. Create detailed explanations with real-world relevance
5. Structure content with clear learning progression

CONTENT STRUCTURE REQUIREMENTS:
- introduction: Engaging 2-3 sentence introduction explaining importance
- mainContent: Comprehensive educational content (300+ words) with examples
- keyPoints: 4-5 specific, actionable key concepts
- practicalApplication: Detailed guide on applying the knowledge
- quickQuiz: High-quality quiz question with specific options and explanation
- realWorldExamples: 2-3 concrete, specific examples

Your entire response MUST be a single JSON object with this structure:
{
  "introduction": "Engaging introduction that hooks the learner...",
  "mainContent": "Comprehensive educational content with detailed explanations, examples, and practical insights...",
  "keyPoints": ["Specific key concept 1", "Specific key concept 2", "Specific key concept 3", "Specific key concept 4"],
  "practicalApplication": "Detailed guide on how to apply this knowledge in real situations...",
  "realWorldExamples": [
    {"title": "Example 1", "description": "Detailed scenario", "outcome": "Key learning"},
    {"title": "Example 2", "description": "Another scenario", "outcome": "Additional insight"}
  ],
  "quickQuiz": {
    "question": "Specific question testing understanding of the content",
    "options": ["Specific option A", "Specific option B", "Specific option C", "Specific option D"],
    "correct": 0,
    "explanation": "Clear explanation connecting answer to content"
  }
}`;

  const userPrompt = `Generate comprehensive educational content for the module titled "${microModule.title}".

Learning Objective: ${microModule.learning_objective || 'Understanding key concepts'}
Estimated Duration: ${microModule.estimated_duration_minutes || 5} minutes

Create substantial, high-quality content that provides real educational value and ensures the learner gains practical understanding of ${microModule.title}. The content should be engaging, informative, and actionable.`;

  const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;

  // Try with first available API key
  try {
    const apiKey = apiKeys[0];
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            response_mime_type: "application/json",
          },
        }),
      }
    );

    if (geminiResponse.ok) {
      const geminiData = await geminiResponse.json();
      const rawAiOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (rawAiOutput) {
        const generatedContent = JSON.parse(rawAiOutput);
        
        // Validate the generated content quality
        if (generatedContent && generatedContent.mainContent && 
            generatedContent.mainContent.length > 100 && 
            generatedContent.quickQuiz) {
          console.log(`✅ High-quality content generated for ${microModule.title}`);
          return generatedContent;
        }
      }
    }
  } catch (error) {
    console.error(`Error generating quiz for ${microModule.title}:`, error);
  }

  // Fallback to minimal content
  return createMinimalContent(microModule);
}

// Check if quiz question is generic
function isGenericQuizQuestion(question: any): boolean {
  if (!question || !question.question || !question.options) {
    return true;
  }

  const genericPatterns = [
    /what is covered in.*\?\?/i,
    /what does.*module.*cover/i,
    /which.*following.*covered/i,
    /what.*main.*topic/i,
    /what.*primary.*focus/i
  ];

  const genericOptionPatterns = [
    /all.*above/i,
    /none.*above/i,
    /basic.*concepts/i,
    /advanced.*topics/i,
    /fundamental.*principles/i,
    /core concepts/i,
    /further details/i,
    /related examples/i
  ];

  const hasGenericQuestion = genericPatterns.some(pattern => 
    pattern.test(question.question)
  );

  const genericOptionsCount = question.options.filter((option: string) =>
    genericOptionPatterns.some(pattern => pattern.test(option))
  ).length;

  const hasPlaceholders = question.question.includes('??') || 
    question.question.includes('[') || 
    question.question.includes(']');

  return hasGenericQuestion || genericOptionsCount >= 2 || hasPlaceholders;
}

// Create minimal but complete content structure
function createMinimalContent(microModule: any): any {
  const title = microModule.title || 'Learning Module';
  const objective = microModule.learning_objective || 'understanding key concepts';
  
  return {
    introduction: `Welcome to this essential module on ${title}. This content will help you ${objective.toLowerCase()}.`,
    mainContent: `This module focuses on ${title}, providing you with the fundamental knowledge and practical skills needed for ${objective}. 

Understanding ${title} is crucial because it forms the foundation for more advanced concepts in this subject area. Through this module, you'll learn the core principles, see how they apply in real-world situations, and develop the confidence to use this knowledge effectively.

Key aspects covered include the basic concepts, practical applications, common challenges, and best practices. By the end of this module, you'll have a solid understanding of ${title} and be ready to apply these concepts in practical scenarios.

The content is designed to be engaging and accessible, with clear explanations and concrete examples that make the material easy to understand and remember. Each concept builds upon the previous one, creating a logical learning progression that ensures comprehensive understanding.`,
    keyPoints: [
      `Understanding the fundamental principles of ${title}`,
      `Recognizing key concepts and their applications`,
      `Applying knowledge in practical situations`,
      `Building confidence for advanced learning`
    ],
    practicalApplication: `To apply what you've learned about ${title}, start by identifying opportunities in your daily activities where these concepts are relevant. Practice using the key principles in low-risk situations first, then gradually apply them to more complex scenarios as your confidence grows.`,
    realWorldExamples: [
      {
        title: "Practical Application",
        description: `A real-world scenario where ${title} principles are applied effectively`,
        outcome: "Demonstrates the practical value of the concepts"
      },
      {
        title: "Common Use Case",
        description: `An everyday situation that benefits from understanding ${title}`,
        outcome: "Shows how the knowledge transfers to daily life"
      }
    ],
    quickQuiz: {
      question: `What is the primary focus of understanding ${title}?`,
      options: [
        objective,
        'Memorizing technical details',
        'Passing tests quickly',
        'Avoiding practical application'
      ],
      correct: 0,
      explanation: `The primary focus is ${objective}, which provides the foundation for practical application and further learning.`
    }
  };
}

// Extract content text from module
function getModuleContentText(microModule: any): string {
  if (typeof microModule.content === 'string') {
    return microModule.content;
  } else if (typeof microModule.content === 'object' && microModule.content !== null) {
    if (microModule.content.mainContent) {
      return microModule.content.mainContent;
    }
    return JSON.stringify(microModule.content);
  }
  return microModule.description || microModule.title || 'Module content';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, course } = await req.json();
    
    // Enhanced Initial Request Logging
    console.log('EduPerfect course finalization started. Request Body:', { 
      userId, 
      courseId: course?.id,
      courseTitle: course?.title,
      hasTopics: !!course?.topics,
      numTopics: course?.topics?.length || 0
    });

    if (course && course.topics && course.topics.length > 0) {
        console.log('Sample of first topic structure:', {
            title: course.topics[0].title,
            hasSubtopics: !!course.topics[0].subtopics,
            numSubtopics: course.topics[0].subtopics?.length || 0,
        });
        if (course.topics[0].subtopics && course.topics[0].subtopics.length > 0) {
            console.log('Sample of first subtopic structure:', {
                title: course.topics[0].subtopics[0].title,
                hasMicroModules: !!course.topics[0].subtopics[0].micro_modules,
                numMicroModules: course.topics[0].subtopics[0].micro_modules?.length || 0,
            });
            if (course.topics[0].subtopics[0].micro_modules && course.topics[0].subtopics[0].micro_modules.length > 0) {
                 console.log('Sample of first micro_module content type:', typeof course.topics[0].subtopics[0].micro_modules[0].content);
                 console.log('Sample of first micro_module content value (first 50 chars):', String(course.topics[0].subtopics[0].micro_modules[0].content).substring(0,50));
            }
        }
    }


    if (!course || !course.id || !course.title || !course.topics) { // Added course.id check
      console.error('Invalid course data provided for finalization. Missing id, title, or topics.', { courseId: course?.id, hasTitle: !!course?.title, hasTopics: !!course?.topics });
      throw new Error('Invalid course data provided for finalization: Missing id, title, or topics.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate and count course structure
    let totalTopics = 0;
    let totalSubtopics = 0;
    let totalExpectedModules = 0; // Renamed from totalModules to clarify it's from input
    let modulesWithNonNullContent = 0; // Renamed for clarity

    course.topics.forEach((topic: any, topicIndex: number) => {
      totalTopics++;
      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        topic.subtopics.forEach((subtopic: any, subtopicIndex: number) => {
          totalSubtopics++;
          if (subtopic.micro_modules && Array.isArray(subtopic.micro_modules)) {
            subtopic.micro_modules.forEach((module: any) => {
              totalExpectedModules++;
              // Check if content is non-null and not an empty object
              if (module.content && (typeof module.content !== 'object' || Object.keys(module.content).length > 0)) {
                modulesWithNonNullContent++;
              }
            });
          }
        });
      }
    });

    console.log(`📊 Course structure validation from input: ${totalTopics} topics, ${totalSubtopics} subtopics, ${totalExpectedModules} expected modules (${modulesWithNonNullContent} with non-null content)`);

    // Create or update the main course record
    const { data: courseRecord, error: courseError } = await supabase
      .from('courses')
      .upsert({
        id: course.id,
        user_id: userId,
        title: course.title,
        description: course.description || 'Comprehensive learning course with micro-modular structure',
        skill_area: course.skill_area || 'General Learning',
        difficulty_level: course.difficulty_level || 'intermediate',
        estimated_duration: course.estimated_duration || '4-6 weeks', // This might be too static
        topics: course.topics, // Storing the full topics structure here
        learning_preferences: course.learning_preferences || {},
        status: 'active'
      })
      .select()
      .single();

    if (courseError) {
      console.error('Course upsert error:', courseError);
      throw new Error(`Course upsert error: ${courseError.message}`);
    }
    console.log(`Successfully upserted course record for ID: ${courseRecord.id}`);

    // **MODIFICATION START**: Delete existing micro-modules for this course first
    console.log(`Attempting to delete existing micro-modules for course ID: ${courseRecord.id}`);
    const { error: deleteError } = await supabase
      .from('micro_modules')
      .delete()
      .eq('course_id', courseRecord.id);

    if (deleteError) {
      console.error(`Error deleting existing micro-modules for course ID ${courseRecord.id}:`, deleteError);
      // Depending on requirements, you might want to throw an error here or just log and continue
      // For now, we'll log and continue, attempting to insert new modules.
    } else {
      console.log(`Successfully deleted existing micro-modules (if any) for course ID: ${courseRecord.id}`);
    }
    // **MODIFICATION END**

    // Create micro-modules from the course structure
    const moduleCreationPromises = [];
    let intendedMicroModulesToCreate = 0;
    
    for (let topicIndex = 0; topicIndex < course.topics.length; topicIndex++) {
      const topic = course.topics[topicIndex];
      console.log(`Processing Topic ${topicIndex}: "${topic.title}"`);
      
      if (topic.subtopics && Array.isArray(topic.subtopics)) {
        for (let subtopicIndex = 0; subtopicIndex < topic.subtopics.length; subtopicIndex++) {
          const subtopic = topic.subtopics[subtopicIndex];
          console.log(`  Processing Subtopic ${subtopicIndex} under Topic ${topicIndex}: "${subtopic.title}"`);
          
          if (subtopic.micro_modules && Array.isArray(subtopic.micro_modules)) {
            console.log(`    Found ${subtopic.micro_modules.length} micro-modules for T:${topicIndex}-S:${subtopicIndex}`);
            for (let moduleIndex = 0; moduleIndex < subtopic.micro_modules.length; moduleIndex++) {
              intendedMicroModulesToCreate++;
              const microModule = subtopic.micro_modules[moduleIndex];
              
              console.log(`      Preparing MicroModule ${moduleIndex} (T:${topicIndex}-S:${subtopicIndex}-M:${moduleIndex}): "${microModule.title}"`);

              // Generate comprehensive content for this module
              console.log(`      Generating comprehensive content for module: ${microModule.title}`);
              const comprehensiveContent = await generateComprehensiveContent(microModule, supabase);
              
              let moduleContentText;
              if (comprehensiveContent && typeof comprehensiveContent === 'object') {
                // Use the generated comprehensive content structure
                moduleContentText = JSON.stringify(comprehensiveContent);
                console.log(`        ✅ Generated comprehensive content for M:${moduleIndex} (${Object.keys(comprehensiveContent).length} sections)`);
              } else if (typeof microModule.content === 'string') {
                moduleContentText = microModule.content;
                console.log(`        Using existing string content for M:${moduleIndex}`);
              } else if (typeof microModule.content === 'object' && microModule.content !== null && Object.keys(microModule.content).length > 0) {
                moduleContentText = JSON.stringify(microModule.content);
                console.log(`        Using existing object content for M:${moduleIndex}`);
              } else {
                // Last resort: use the comprehensive content as string
                moduleContentText = JSON.stringify(comprehensiveContent);
                console.warn(`        ⚠️ Using generated content as fallback for M:${moduleIndex}`);
              }
              
              // Extract quiz from comprehensive content if available
              // Ensure we always have a valid quiz object for the module
              let moduleQuiz: any = null;
              if (comprehensiveContent && (comprehensiveContent as any).quickQuiz) {
                moduleQuiz = (comprehensiveContent as any).quickQuiz;
              } else if (microModule.content && (microModule.content as any).quickQuiz) {
                moduleQuiz = (microModule.content as any).quickQuiz;
              }

              // Normalize and validate quiz; fallback to minimal if invalid or empty
              const normalizeQuiz = (q: any) => {
                if (!q) return null;
                const src = Array.isArray(q) ? q[0] : q;
                if (!src) return null;
                const question = src.question || src.prompt;
                const options = src.options || src.choices || src.answers;
                let correct = src.correct ?? src.correctAnswerIndex ?? src.answer ?? src.correctAnswer;
                if (typeof correct === 'string') {
                  const parsed = parseInt(correct, 10);
                  if (!isNaN(parsed)) correct = parsed;
                }
                if (!question || !Array.isArray(options) || options.length === 0 || typeof correct !== 'number' || correct < 0 || correct >= options.length) {
                  return null;
                }
                return { question, options, correct, explanation: src.explanation || '' };
              };

              let normalizedModuleQuiz = normalizeQuiz(moduleQuiz);
              if (!normalizedModuleQuiz) {
                normalizedModuleQuiz = createMinimalContent(microModule).quickQuiz;
              }
              
              const moduleData = {
                subtopic_id: `${topicIndex}-${subtopicIndex}`, 
                course_id: courseRecord.id,
                topic_index: topicIndex,
                subtopic_index: subtopicIndex,
                module_index: moduleIndex,
                title: microModule.title || `Module ${moduleIndex + 1}`,
                content: moduleContentText,
                estimated_duration_minutes: microModule.estimated_duration_minutes || 5,
                learning_objective: microModule.learning_objective || `Learn about ${microModule.title || 'this topic'}`,
                quick_quiz: normalizedModuleQuiz,
                prerequisites: microModule.prerequisites || []
              };
              console.log(`        Prepared moduleData for insert: (Title: ${moduleData.title}, Content start: ${moduleData.content.substring(0,30)}...)`);

              // **MODIFICATION START**: Changed from upsert to insert
              const modulePromise = supabase
                .from('micro_modules')
                .insert(moduleData) // Changed from .upsert(moduleData, { onConflict: 'course_id,topic_index,subtopic_index,module_index' })
                .then(({ data, error }) => { 
                  if (error) {
                    console.error(`Error inserting module T:${topicIndex}-S:${subtopicIndex}-M:${moduleIndex} ("${moduleData.title}"):`, error);
                    return { status: 'rejected', reason: error, topicIndex, subtopicIndex, moduleIndex, title: moduleData.title };
                  }
                  console.log(`        Successfully inserted module T:${topicIndex}-S:${subtopicIndex}-M:${moduleIndex} ("${moduleData.title}")`);
                  return { status: 'fulfilled', value: data, topicIndex, subtopicIndex, moduleIndex, title: moduleData.title };
                });
              // **MODIFICATION END**
              moduleCreationPromises.push(modulePromise);
            }
          } else {
            console.warn(`    No micro_modules array found for Topic ${topicIndex}, Subtopic ${subtopicIndex}.`);
          }
        }
      } else {
        console.warn(`  No subtopics array found for Topic ${topicIndex}.`);
      }
    }

    console.log(`⚡ Attempting to finalize ${intendedMicroModulesToCreate} micro-modules through ${moduleCreationPromises.length} promises...`);
    const moduleResults = await Promise.allSettled(moduleCreationPromises);
    
    let successfulModules = 0;
    let failedModules = 0;
    
    moduleResults.forEach((result, i) => { // 'i' is the promise index
      if (result.status === 'fulfilled') {
        // Check if the individual promise resolution indicates an error (from the .then block)
        if (result.value && result.value.status === 'rejected') {
          failedModules++;
          console.error(`Module (T:${result.value.topicIndex}-S:${result.value.subtopicIndex}-M:${result.value.moduleIndex} "${result.value.title}") failed during insert:`, result.value.reason);
        } else {
          successfulModules++;
        }
      } else { // status === 'rejected' (error in the promise itself, not caught by .then)
        failedModules++;
        // The result.reason here is from Promise.allSettled if the .upsert().then() itself threw an unhandled error
        console.error(`Module creation promise (index ${i}) failed before insert completion or in .then handler:`, result.reason);
         // Attempt to get more details if it's a Supabase error structure
        const reason = result.reason as any;
        if (reason && reason.message) console.error(`  Supabase error message: ${reason.message}`);
        if (reason && reason.details) console.error(`  Supabase error details: ${reason.details}`);
        if (reason && reason.hint) console.error(`  Supabase error hint: ${reason.hint}`);
      }
    });
    
    console.log(`Micro-module finalization summary: ${successfulModules} succeeded, ${failedModules} failed out of ${intendedMicroModulesToCreate} intended.`);

    if (failedModules > 0) {
      console.warn(`⚠️ ${failedModules} modules failed during finalization process.`);
    }

    console.log(`🎉 EduPerfect course finalized: ${courseRecord.id} with ${successfulModules} successfully processed micro-modules.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        course: courseRecord, // Return the main course record
        message: `EduPerfect course finalized. ${successfulModules} micro-modules processed, ${failedModules} failed.`,
        stats: {
          topics: totalTopics,
          subtopics: totalSubtopics,
          expectedMicroModules: totalExpectedModules,
          processedMicroModulesSuccessfully: successfulModules,
          failedMicroModules: failedModules,
          inputContentQualityScore: totalExpectedModules > 0 ? Math.round((modulesWithNonNullContent / totalExpectedModules) * 100) : 0,
          contentType: 'finalized-micro-modular-learning'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Unhandled Finalization error in main try-catch:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return new Response(
      JSON.stringify({ 
        error: errorMessage || 'An unexpected error occurred during finalization.',
        details: errorStack || String(error) // Include stack for better debugging
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
