import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
// Enhanced quality validation patterns - EXPANDED
const GENERIC_QUESTION_PATTERNS = [
  /what is covered in.*\?\?/i,
  /what does.*module.*cover/i,
  /which.*following.*covered/i,
  /what.*main.*topic/i,
  /what.*primary.*focus/i,
  /what.*main.*learning.*objective/i,
  /based on.*content.*about.*what is/i,
  /a researcher wants to understand/i,
  /which.*following.*most effective method/i,
  /what would be the best way to/i,
  /which method would be most suitable/i,
  /what is the.*learning objective/i,
  /main.*objective.*of.*module/i,
  /content.*about.*\w+.*what.*main/i
];
const GENERIC_OPTION_PATTERNS = [
  /all.*above/i,
  /none.*above/i,
  /basic.*concepts/i,
  /advanced.*topics/i,
  /fundamental.*principles/i,
  /core concepts/i,
  /further details/i,
  /related examples/i,
  /questionnaire/i,
  /survey/i,
  /interview/i,
  /observation/i
];
const REPETITIVE_EXPLANATION_PATTERNS = [
  /most effective method for gathering data/i,
  /provides a broader representation/i,
  /allows.*collect.*information.*large number/i,
  /questionnaire.*best.*because/i
];
const questionTracker = {
  usedPatterns: new Set(),
  usedScenarios: new Set(),
  usedContexts: new Set(),
  questionTexts: [],
  explanationTexts: []
};
function calculateSimilarity(str1, str2) {
  const words1 = str1.toLowerCase().split(/\s+/).filter((word)=>word.length > 3);
  const words2 = str2.toLowerCase().split(/\s+/).filter((word)=>word.length > 3);
  const commonWords = words1.filter((word)=>words2.includes(word));
  const similarityScore = commonWords.length / Math.max(words1.length, words2.length);
  // Additional check for identical sentence structure
  const structure1 = str1.toLowerCase().replace(/\w+/g, 'X');
  const structure2 = str2.toLowerCase().replace(/\w+/g, 'X');
  const structureSimilarity = structure1 === structure2 ? 1 : 0;
  return Math.max(similarityScore, structureSimilarity);
}
function isGenericOrRepetitive(question) {
  if (!question || !question.question) {
    return true;
  }
  // Check if question text matches generic patterns
  const hasGenericQuestion = GENERIC_QUESTION_PATTERNS.some((pattern)=>pattern.test(question.question));
  // Check if options are too generic (for MCQ)
  if (question.options) {
    const genericOptionsCount = question.options.filter((option)=>GENERIC_OPTION_PATTERNS.some((pattern)=>pattern.test(option))).length;
    if (genericOptionsCount >= 2) return true;
  }
  // Check for repetitive explanation patterns
  if (question.explanation) {
    const hasRepetitiveExplanation = REPETITIVE_EXPLANATION_PATTERNS.some((pattern)=>pattern.test(question.explanation));
    if (hasRepetitiveExplanation) return true;
    // Check for explanation similarity with previous questions
    for (const existingExplanation of questionTracker.explanationTexts){
      if (calculateSimilarity(question.explanation, existingExplanation) > 0.7) {
        return true;
      }
    }
  }
  // Check for question text similarity with previous questions
  for (const existingQuestion of questionTracker.questionTexts){
    if (calculateSimilarity(question.question, existingQuestion) > 0.6) {
      return true;
    }
  }
  // Check for placeholder-like content
  const hasPlaceholders = question.question.includes('??') || question.question.includes('[') || question.question.includes(']');
  return hasGenericQuestion || hasPlaceholders;
}
function addToTracker(question) {
  questionTracker.questionTexts.push(question.question);
  if (question.explanation) {
    questionTracker.explanationTexts.push(question.explanation);
  }
}
// Function to get all available API keys from environment variables
const getApiKeys = ()=>{
  const keys = [];
  const baseKey = Deno.env.get("GOOGLE_API_KEY");
  if (baseKey) keys.push(baseKey);
  for(let i = 2; i <= 20; i++){
    const key = Deno.env.get(`GOOGLE_API_KEY_${i}`);
    if (key) keys.push(key);
  }
  console.log(`Found ${keys.length} Google API keys.`);
  return keys;
};
// Question generation templates for diversity
const QUESTION_TEMPLATES = [
  {
    type: 'application',
    prompt: 'Create a practical application question that tests how students would use this knowledge in real-world Kenyan scenarios.'
  },
  {
    type: 'analysis',
    prompt: 'Create an analytical question that requires students to compare, contrast, or break down concepts from the content.'
  },
  {
    type: 'evaluation',
    prompt: 'Create an evaluation question that asks students to judge, critique, or assess something based on the content.'
  },
  {
    type: 'comprehension',
    prompt: 'Create a comprehension question that tests understanding of key concepts without being too basic.'
  },
  {
    type: 'synthesis',
    prompt: 'Create a question that requires students to combine ideas or create something new based on the content.'
  }
];
const KENYAN_CONTEXTS = [
  'urban Kenyan school setting',
  'rural Kenyan community',
  'Kenyan marketplace scenario',
  'Kenyan agricultural context',
  'Kenyan wildlife conservation',
  'Kenyan transportation system',
  'Kenyan healthcare scenario',
  'Kenyan business environment',
  'Kenyan cultural celebration',
  'Kenyan environmental project'
];
async function generateQualityQuestion(moduleTitle, content, learningObjective, apiKey, questionIndex, maxRetries = 5, supabase, userId) {
  // Select diverse template and context for this question
  const template = QUESTION_TEMPLATES[questionIndex % QUESTION_TEMPLATES.length];
  const context = KENYAN_CONTEXTS[Math.floor(Math.random() * KENYAN_CONTEXTS.length)];
  // Create additional randomization for extreme diversity
  const questionApproaches = [
    'scenario-based problem solving',
    'definition and application',
    'compare and contrast concepts',
    'cause and effect analysis',
    'step-by-step process evaluation',
    'real-world application',
    'critical thinking assessment'
  ];
  const approach = questionApproaches[Math.floor(Math.random() * questionApproaches.length)];
  for(let attempt = 0; attempt < maxRetries; attempt++){
    const systemInstruction = `You are an expert educational content creator for Kenyan CBC curriculum students.

ABSOLUTE DIVERSITY REQUIREMENTS:
1. Question #${questionIndex + 1} MUST be completely different from any previous questions
2. NEVER repeat question structures, even if slightly modified
3. NEVER use "Based on the content about [X], what is [Y]?" pattern
4. NEVER use "main learning objective" as question focus
5. Create ${approach} style questions for cognitive level: ${template.type}
6. Each question must test different specific details from the content

FORBIDDEN QUESTION STARTERS (NEVER USE):
- "Based on the content about..."
- "What is the main learning objective..."
- "A researcher wants to understand..."
- "Which of the following would be most effective..."
- "What would be the best way to..."
- "What is covered in this module..."

REQUIRED QUESTION DIVERSITY:
- Extract specific facts, concepts, or procedures from the module content
- Create questions about specific details mentioned in the content
- Test understanding of particular examples or scenarios in the content
- Focus on specific terminology, definitions, or processes described
- Ask about relationships between concepts mentioned in the content

KENYAN CONTEXT INTEGRATION:
- Set questions in ${context}
- Use Kenyan examples: counties (Nairobi, Mombasa, Kisumu), wildlife (elephants, lions, zebras)
- Reference Kenyan culture: matatu, ugali, chai, boda boda
- Include Kenyan geography: Mount Kenya, Lake Victoria, Rift Valley
- Use Kenyan currency (KSh) for any numerical questions

CONTENT-SPECIFIC REQUIREMENTS:
- Read the module content carefully and identify specific concepts, facts, or processes
- Create questions that test understanding of these specific elements
- Ensure questions can ONLY be answered by someone who studied this specific content
- Avoid general knowledge questions that could be answered without reading the module

Your response must be valid JSON with NO additional text:`;
    const userPrompt = `CRITICAL: Generate Question #${questionIndex + 1} that is completely unique and different from all previous questions.

Module: ${JSON.stringify(moduleTitle)}
Learning Objective: ${JSON.stringify(learningObjective)}

Content to analyze:
${JSON.stringify(content)}

MANDATORY REQUIREMENTS:
1. Extract 2-3 specific concepts, facts, or details from the module content above
2. Create a ${approach} question testing one of these specific details
3. Set the question in ${context} with Kenyan examples
4. Use ${template.type} cognitive level approach
5. Question must be answerable ONLY by reading this specific content
6. Avoid any similarity to "learning objective" or "content coverage" questions

EXAMPLES OF GOOD SPECIFIC QUESTIONS:
- About a specific procedure mentioned in the content
- About a particular example or case study in the content  
- About specific terminology or definitions provided
- About cause-effect relationships described in the content
- About step-by-step processes outlined in the content

Generate a completely unique question that tests specific knowledge from this content:`;
    const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;
    // Check token limit before making API call (only on first attempt)
    if (attempt === 0) {
      const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(supabase, userId, fullPrompt, 1000, 'question_generation', undefined, undefined);
      if (!canProceed) {
        throw new Error(JSON.stringify({
          error: 'Token limit exceeded',
          tokensNeeded,
          tokensRemaining,
          upgradeRequired: true
        }));
      }
      console.log(`✅ Token check passed for question generation`);
    }
    try {
      console.log(`Generating question attempt ${attempt + 1} for module: ${moduleTitle}`);
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
            response_mime_type: "application/json"
          }
        })
      });
      if (!geminiResponse.ok) {
        console.error(`Gemini API error: ${geminiResponse.status}`);
        continue;
      }
      const geminiData = await geminiResponse.json();
      const rawAiOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawAiOutput) {
        console.error("No text found in Gemini response");
        continue;
      }
      const generatedQuestion = JSON.parse(rawAiOutput);
      // Log actual token usage
      await logActualUsage(supabase, userId, rawAiOutput, 'question_generation', undefined, undefined, {
        model: 'gemini-1.5-flash',
        moduleTitle,
        questionIndex,
        attempt: attempt + 1
      });
      // Validate the generated question for quality and uniqueness
      if (!isGenericOrRepetitive(generatedQuestion)) {
        console.log(`✅ High-quality, unique question generated for ${moduleTitle} on attempt ${attempt + 1}`);
        addToTracker(generatedQuestion);
        return generatedQuestion;
      } else {
        console.log(`❌ Generic or repetitive question detected for ${moduleTitle} on attempt ${attempt + 1}, retrying...`);
        console.log(`Question text: ${generatedQuestion.question?.substring(0, 100)}...`);
      // Continue to next attempt
      }
    } catch (error) {
      console.error(`Error generating question attempt ${attempt + 1}:`, error);
    }
  }
  console.warn(`⚠️ Could not generate high-quality question for ${moduleTitle} after ${maxRetries} attempts`);
  return null;
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { courseTitle, selectedTopicsDetail, selectedModuleContents, preferences, userId } = body;
    if (!courseTitle || !selectedModuleContents || selectedModuleContents.length === 0 || !preferences) {
      return new Response(JSON.stringify({
        error: "Missing required fields: courseTitle, selectedModuleContents, or preferences."
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({
        error: "User ID is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Initialize Supabase client for token tracking
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      console.error("No GOOGLE_API_KEYs found in Supabase secrets.");
      return new Response(JSON.stringify({
        error: "AI service temporarily unavailable. Missing API Key configuration."
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const questions = [];
    let apiKeyIndex = 0;
    // Reset question tracker for this session
    questionTracker.usedPatterns.clear();
    questionTracker.usedScenarios.clear();
    questionTracker.usedContexts.clear();
    questionTracker.questionTexts = [];
    questionTracker.explanationTexts = [];
    // Use the number of questions per module specified by the user, or default to 10
    const questionsPerModule = preferences.questionsPerModule || 10;
    const totalQuestionsToGenerate = selectedModuleContents.length * questionsPerModule;
    console.log(`Generating ${questionsPerModule} questions per module across ${selectedModuleContents.length} modules (${totalQuestionsToGenerate} total questions).`);
    // Generate questions for each module
    for (const module of selectedModuleContents){
      console.log(`Generating ${questionsPerModule} questions for module: ${module.title}`);
      for(let q = 0; q < questionsPerModule; q++){
        const currentApiKey = apiKeys[apiKeyIndex % apiKeys.length];
        console.log(`Generating question ${q + 1}/${questionsPerModule} for module: ${module.title}`);
        const question = await generateQualityQuestion(module.title, module.content, module.learning_objective || '', currentApiKey, questions.length, 3, supabase, userId);
        if (question) {
          questions.push(question);
        } else {
          // If we still can't generate a quality question after all retries, skip it
          console.warn(`⚠️ Skipping question generation for module: ${module.title} - Could not generate unique, high-quality question`);
        // Don't add a fallback question to avoid repetitive content
        }
        // Rotate to next API key
        apiKeyIndex++;
        // Small delay to prevent rate limiting
        await new Promise((resolve)=>setTimeout(resolve, 200));
      }
    }
    console.log(`Successfully generated ${questions.length} quality questions`);
    return new Response(JSON.stringify({
      questions
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Critical error in generate-questions function:", error.message, error.stack);
    return new Response(JSON.stringify({
      error: `Unable to process your request: ${error.message}`
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
