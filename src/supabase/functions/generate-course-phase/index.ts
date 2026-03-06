import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced JSON parsing with comprehensive error handling
function parseAIResponse(content: string): any {
  console.log('📄 Raw AI response length:', content.length);
  console.log('🔍 First 300 chars:', content.substring(0, 300));
  
  // Remove markdown code blocks and extra whitespace
  let cleanedContent = content.trim();
  cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Extract JSON from the response
  const firstBrace = cleanedContent.indexOf('{');
  const lastBrace = cleanedContent.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    console.error('❌ No valid JSON structure found');
    throw new Error('No valid JSON structure found in response');
  }
  
  let jsonContent = cleanedContent.substring(firstBrace, lastBrace + 1);
  console.log('📋 Extracted JSON length:', jsonContent.length);
  
  // Multiple parsing strategies
  const parseStrategies = [
    // Strategy 1: Direct parsing
    () => JSON.parse(jsonContent),
    
    // Strategy 2: Fix common issues
    () => {
      let fixed = jsonContent
        // Fix unescaped quotes in strings
        .replace(/"([^"]*)":\s*"([^"]*(?:[^"\\]|\\.)*)"/g, (match, key, value) => {
          const cleanValue = value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"${key}": "${cleanValue}"`;
        })
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix control characters
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      return JSON.parse(fixed);
    },
    
    // Strategy 3: Extract key-value pairs manually
    () => {
      const result: any = {};
      
      // Extract main structure based on expected keys
      const extractValue = (key: string) => {
        const regex = new RegExp(`"${key}"\\s*:\\s*([^,}]+|\\{[^}]*\\}|\\[[^\\]]*\\])`, 'g');
        const match = regex.exec(jsonContent);
        if (match) {
          try {
            return JSON.parse(match[1]);
          } catch {
            // If it's a string, clean it up
            return match[1].replace(/^"|"$/g, '').replace(/\\"/g, '"');
          }
        }
        return null;
      };
      
      // Try to extract expected keys based on phase
      if (jsonContent.includes('"topics"')) {
        result.topics = extractValue('topics') || [];
      }
      if (jsonContent.includes('"subtopics"')) {
        result.subtopics = extractValue('subtopics') || [];
      }
      if (jsonContent.includes('"modules"')) {
        result.modules = extractValue('modules') || [];
      }
      if (jsonContent.includes('"content"')) {
        result.content = extractValue('content') || {};
      }
      
      if (Object.keys(result).length === 0) {
        throw new Error('No recognizable data structure found');
      }
      
      return result;
    }
  ];
  
  // Try each strategy
  for (let i = 0; i < parseStrategies.length; i++) {
    try {
      const result = parseStrategies[i]();
      console.log(`✅ Parsing succeeded with strategy ${i + 1}`);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ Strategy ${i + 1} failed:`, errorMessage);
      if (i === parseStrategies.length - 1) {
        console.error('💥 All parsing strategies failed');
        console.error('📋 Problematic content sample:', jsonContent.substring(0, 500));
        throw new Error(`Failed to parse AI response. All strategies failed. Last error: ${errorMessage}`);
      }
    }
  }
}

// Multi-API key implementation with automatic rotation
async function callGeminiAPIWithMultipleKeys(prompt: string, phase: string): Promise<any> {
  const apiKeys = [];
  
  // Collect all available API keys
  let currentKey = Deno.env.get('GOOGLE_API_KEY');
  if (currentKey) apiKeys.push(currentKey);
  
  let keyIndex = 2;
  while (keyIndex <= 20) {
    const nextKey = Deno.env.get(`GOOGLE_API_KEY_${keyIndex}`);
    if (!nextKey) break;
    apiKeys.push(nextKey);
    keyIndex++;
  }

  if (apiKeys.length === 0) {
    throw new Error('No Google API keys configured');
  }

  console.log(`🔑 Available API keys: ${apiKeys.length}`);

  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const keyNumber = i + 1;
    
    try {
      console.log(`📡 Attempting Gemini API call with key ${keyNumber} for phase: ${phase}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 20,
              topP: 0.8,
              maxOutputTokens: 4096,
              responseMimeType: "application/json"
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (geminiResponse.ok) {
        console.log(`✅ Success with API key ${keyNumber}`);
        const geminiData = await geminiResponse.json();
        
        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
          throw new Error('Invalid response structure from Gemini API');
        }

        return geminiData.candidates[0].content.parts[0].text;
      }

      const errorText = await geminiResponse.text();
      console.error(`❌ API key ${keyNumber} failed:`, geminiResponse.status, errorText);

      if (geminiResponse.status === 429) {
        console.log(`🔄 Quota exceeded for key ${keyNumber}, trying next key...`);
        continue;
      } else {
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorName = error instanceof Error ? error.name : 'Unknown';
      console.error(`💥 Error with API key ${keyNumber}:`, errorMessage);
      
      if (errorName === 'AbortError') {
        console.log(`⏰ Request timeout for key ${keyNumber}`);
      }
      
      if (errorMessage.includes('429') && i < apiKeys.length - 1) {
        console.log(`🔄 Trying next API key due to quota exhaustion...`);
        continue;
      }
      
      if (i === apiKeys.length - 1) {
        throw new Error(`All API keys exhausted or failed. Last error: ${errorMessage}`);
      }
    }
  }

  throw new Error('All API keys failed');
}

// Function to get course length specifications with strict limits
const getCourseLengthSpecifications = (length: string) => {
  switch (length) {
    case 'lesson':
      return {
        description: 'Quick Learning Lesson (15-30 minutes)',
        topicCount: 'exactly 1-3 topics',
        subtopicCount: 'exactly 3-5 subtopics per topic',
        moduleCount: 'exactly 1-5 modules per subtopic',
        instructions: 'STRICT LIMITS: Generate 1-3 topics only. Each topic MUST have 3-5 subtopics. Each subtopic MUST have 1-5 modules only. DO NOT exceed these limits.'
      };
    case 'short':
      return {
        description: 'Quick-Start Intensive (1-2 weeks)',
        topicCount: '3-5 focused topics',
        subtopicCount: '5-7 subtopics per topic',
        moduleCount: '3-8 modules per subtopic',
        instructions: 'Focus on core essentials, practical shortcuts, immediate applicability.'
      };
    case 'standard':
      return {
        description: 'Comprehensive Program (3-6 weeks)',
        topicCount: '5-8 comprehensive topics',
        subtopicCount: '7-10 subtopics per topic',
        moduleCount: '5-10 modules per subtopic',
        instructions: 'Include comprehensive coverage, balanced theory-practice mix, progressive skill building.'
      };
    case 'comprehensive':
      return {
        description: 'Mastery Journey (6-12 weeks)',
        topicCount: '8-12 detailed topics',
        subtopicCount: '10-15 subtopics per topic',
        moduleCount: '8-15 modules per subtopic',
        instructions: 'Include advanced concepts, multiple perspectives, expert insights, extensive practice.'
      };
    default:
      return {
        description: 'Flexible Learning Path',
        topicCount: '5-7 adaptable topics',
        subtopicCount: '5-10 subtopics per topic',
        moduleCount: '5-10 modules per subtopic',
        instructions: 'Provide balanced coverage with optional advanced sections.'
      };
  }
};

// Function to validate the generated data against limits
function validateGeneratedData(data: any, phase: string, courseLength: string): { valid: boolean, error?: string } {
  const limits = getCourseLengthSpecifications(courseLength);
  
  if (phase === 'topics' && data.topics) {
    // Enforce topic count limits for lessons
    if (courseLength === 'lesson' && data.topics.length > 3) {
      return { 
        valid: false, 
        error: `Generated ${data.topics.length} topics but only 1-3 topics are allowed for lessons` 
      };
    }
    return { valid: true };
  }
  
  if (phase === 'subtopics' && data.subtopics) {
    // Enforce subtopic count limits for lessons
    if (courseLength === 'lesson' && data.subtopics.length > 5) {
      return { 
        valid: false, 
        error: `Generated ${data.subtopics.length} subtopics but only 3-5 subtopics are allowed per topic for lessons` 
      };
    }
    if (courseLength === 'lesson' && data.subtopics.length < 3) {
      return { 
        valid: false, 
        error: `Generated only ${data.subtopics.length} subtopics but at least 3 subtopics are required per topic for lessons` 
      };
    }
    return { valid: true };
  }
  
  if (phase === 'modules' && data.modules) {
    // Enforce module count limits for lessons
    if (courseLength === 'lesson' && data.modules.length > 5) {
      return { 
        valid: false, 
        error: `Generated ${data.modules.length} modules but only 1-5 modules are allowed per subtopic for lessons` 
      };
    }
    if (courseLength === 'lesson' && data.modules.length < 1) {
      return { 
        valid: false, 
        error: `Generated no modules but at least 1 module is required per subtopic for lessons` 
      };
    }
    return { valid: true };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { userId, phase, formData, topicIndex, subtopicIndex, moduleIndex, sessionId } = requestData;
    
    // Validate required data exists based on phase
    const topicData = requestData.topicData;
    const subtopicData = requestData.subtopicData;
    const moduleData = requestData.moduleData;
    
    console.log('🚀 EduPerfect phased generation - Phase:', phase, { userId, phase, topicIndex, subtopicIndex, moduleIndex, sessionId, timestamp: new Date().toISOString() });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if session is still active (not cancelled)
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('generation_sessions')
        .select('status')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (sessionError || !session || session.status === 'cancelled') {
        console.log('🛑 Generation session cancelled or not found, aborting...');
        return new Response(
          JSON.stringify({ 
            error: 'Generation session was cancelled',
            cancelled: true
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update session activity
      await supabase
        .from('generation_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('id', sessionId);
    }

    const apiKeys = [];
    
    // Collect all available API keys
    let currentKey = Deno.env.get('GOOGLE_API_KEY');
    if (currentKey) apiKeys.push(currentKey);
    
    let keyIndex = 2;
    while (keyIndex <= 20) {
      const nextKey = Deno.env.get(`GOOGLE_API_KEY_${keyIndex}`);
      if (!nextKey) break;
      apiKeys.push(nextKey);
      keyIndex++;
    }

    console.log('🔑 Available API keys:', apiKeys.length);

    if (apiKeys.length === 0) {
      throw new Error('No API keys available for generation');
    }
    
    let prompt = '';
    let successMessage = '';
    let courseLength = formData?.courseLength || 'standard';

    if (phase === 'topics') {
      const courseLengthSpec = getCourseLengthSpecifications(courseLength);
      prompt = `You are EduPerfect, an AI course generator. Generate ${courseLengthSpec.topicCount} for a course on "${formData.skill}".

COURSE LENGTH: ${courseLengthSpec.description}
TARGET: ${courseLengthSpec.moduleCount} modules per subtopic
LEARNER: Age ${formData.age}, ${formData.educationalBackground} background

${courseLengthSpec.instructions}

${formData.courseLength === 'lesson' ? `
CRITICAL FOR LESSON FORMAT:
- Generate EXACTLY 1-3 topics maximum (DO NOT exceed this limit)
- Each topic MUST cover core essentials only
- Each topic MUST be designed to have 3-5 subtopics (no more, no less)
- Each subtopic MUST be designed to have 1-5 modules (no more, no less)
- Focus on immediate practical value
- Use DESCRIPTIVE NAMES, not generic ones like "Topic 1" or "Introduction"
` : ''}

IMPORTANT: Use descriptive, specific topic names that clearly indicate what will be learned.
Examples of GOOD topic names:
- "Multiplicative Identity and Zero Properties"
- "Advanced Python Data Structures"
- "Digital Marketing Campaign Strategy"

Examples of BAD topic names (DO NOT USE):
- "Topic 1"
- "Introduction"
- "Basic Concepts"
- "Getting Started"

Return ONLY valid JSON:
{
  "topics": [
    {
      "title": "Specific, Descriptive Topic Title (NOT 'Topic 1')",
      "description": "Brief description optimized for ${formData.age} age group",
      "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
      "estimatedDuration": "Duration based on ${courseLengthSpec.description}"
    }
  ]
}`;
      successMessage = `Phase topics completed successfully`;
    }

    if (phase === 'subtopics') {
      if (!topicData) {
        throw new Error('Topic data is required for subtopics generation');
      }
      
      const courseLengthSpec = getCourseLengthSpecifications(courseLength);
      prompt = `You are EduPerfect. Generate detailed subtopics for the topic: "${topicData.title}"

Topic Description: ${topicData.description}

🎯 PHASE 2: GENERATE SUBTOPICS

${courseLength === 'lesson' ? `
CRITICAL FOR LESSON FORMAT:
- Generate EXACTLY 3-5 subtopics (NO MORE, NO LESS)
- Each subtopic MUST be designed to have 1-5 modules (no more, no less)
- Focus on core essentials and practical value
- Use DESCRIPTIVE NAMES, not generic ones like "Subtopic 1"
` : `For this topic, create ${courseLengthSpec.subtopicCount} detailed subtopics that:`}
- Break down the topic into manageable learning units
- Follow logical progression
- Each can be completed in 3-4 learning sessions
- Include clear learning objectives

IMPORTANT: Use descriptive, specific subtopic names that clearly indicate what will be learned.
Examples of GOOD subtopic names:
- "Understanding Matrix Multiplication Rules"
- "List Comprehensions and Lambda Functions"
- "Social Media Advertising Platforms"

Examples of BAD subtopic names (DO NOT USE):
- "Subtopic 1"
- "Part A"
- "Section 1"
- "Basic Introduction"

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.
IMPORTANT: Avoid using operators like +, -, *, / in descriptions. Use words instead (plus, minus, multiply, divide).

{
  "subtopics": [
    {
      "title": "Specific, Descriptive Subtopic Title (NOT 'Subtopic 1')",
      "description": "Detailed description",
      "learningObjectives": ["Specific objective 1", "Specific objective 2"],
      "estimatedDuration": "X minutes",
      "prerequisites": ["Previous concepts needed"]
    }
  ]
}`;
      successMessage = `Phase subtopics completed successfully`;
    }

    if (phase === 'modules') {
      if (!subtopicData) {
        throw new Error('Subtopic data is required for modules generation');
      }
      
      const courseLengthSpec = getCourseLengthSpecifications(courseLength);
      prompt = `You are EduPerfect. Generate learning modules for the subtopic: "${subtopicData.title}"

Subtopic Description: ${subtopicData.description}

🎯 PHASE 3: GENERATE MODULES

${courseLength === 'lesson' ? `
CRITICAL FOR LESSON FORMAT:
- Generate EXACTLY 1-5 focused learning modules (NO MORE, NO LESS)
- Each module MUST teach one specific concept or skill
- Focus on core essentials and practical value
- Use DESCRIPTIVE NAMES, not generic ones like "Module 1"
` : `Create ${courseLengthSpec.moduleCount} focused learning modules that:`}
- Each teaches one specific concept or skill
- Can be completed in 10-15 minutes
- Include practical application
- Build towards the subtopic objectives

IMPORTANT: Use descriptive, specific module names that clearly indicate what will be learned.
Examples of GOOD module names:
- "Calculating Determinants of 2x2 Matrices"
- "Implementing Binary Search in Python"
- "Creating Effective Facebook Ad Headlines"

Examples of BAD module names (DO NOT USE):
- "Module 1"
- "Lesson A"
- "Introduction"
- "Getting Started"

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.
IMPORTANT: Avoid using operators like +, -, *, / in descriptions. Use words instead (plus, minus, multiply, divide).
IMPORTANT: Keep descriptions simple and avoid complex punctuation or quotes.

{
  "modules": [
    {
      "title": "Specific, Descriptive Module Title (NOT 'Module 1')",
      "description": "What this module teaches - keep simple",
      "learningObjective": "Specific skill or knowledge gained",
      "estimatedDuration": "X minutes",
      "contentType": "theory/practical/exercise"
    }
  ]
}`;
      successMessage = `Phase modules completed successfully`;
    }

    if (phase === 'content') {
      if (!moduleData) {
        throw new Error('Module data is required for content generation');
      }
      
      prompt = `You are EduPerfect, a pedagogical expert. Generate COMPREHENSIVE EDUCATIONAL CONTENT as a complete React component for the module: "${moduleData.title}"

Module Description: ${moduleData.description}
Learning Objective: ${moduleData.learningObjective}

🎯 PHASE 4: GENERATE RICH KNOWLEDGE-TRANSFER REACT COMPONENT

🚨 CRITICAL CONTENT REQUIREMENTS - NO SUMMARIES ALLOWED:

❌ FORBIDDEN CONTENT PATTERNS:
- Brief overviews or introductions that lack depth
- Generic explanations like "This covers..." or "Learn about..."
- Surface-level content that just lists facts
- Summary-style content without detailed instruction
- Content shorter than 800 words of actual teaching material
- Theoretical descriptions without practical application

✅ REQUIRED RICH EDUCATIONAL CONTENT:
1. COMPREHENSIVE CONCEPT EXPLANATION (200+ words):
   - Break down concepts from first principles
   - Explain WHY things work the way they do
   - Show logical progression of ideas
   - Include historical context or development

2. DETAILED STEP-BY-STEP INSTRUCTION (300+ words):
   - Provide exact procedures and methodologies
   - Show complete workflows with reasoning
   - Include decision points and alternatives
   - Address common pitfalls and solutions

3. MULTIPLE WORKED EXAMPLES (200+ words):
   - Show complete problem-solving processes
   - Include real data and specific scenarios
   - Demonstrate different approaches
   - Explain reasoning behind each step

4. PRACTICAL APPLICATION SECTION (150+ words):
   - Provide actionable implementation steps
   - Include tools, resources, and requirements
   - Show how to adapt to different situations
   - Give success criteria and validation methods

5. EXPERT INSIGHTS AND ADVANCED TECHNIQUES (100+ words):
   - Share professional best practices
   - Include optimization strategies
   - Discuss common expert approaches
   - Provide troubleshooting guidance

ALLOWED IMPORTS ONLY:
- import React from 'react';
- import { motion } from 'framer-motion';
- import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
- import { Badge } from '@/components/ui/badge';
- import { Button } from '@/components/ui/button';
- import { CheckCircle, Lightbulb, Target, BookOpen, Star, ArrowRight, Play } from 'lucide-react';

STYLING REQUIREMENTS:
- Use Tailwind CSS semantic tokens (primary, secondary, muted, accent, etc.)
- Create modern, card-based layouts with smooth animations
- Include framer-motion animations (fadeInUp, stagger effects)
- Structure content into logical sections
- Use gradients and hover effects for visual appeal
- Make it responsive and accessible
- Use proper semantic HTML structure

MANDATORY CONTENT STRUCTURE (TOTAL 1000+ WORDS):
1. HERO SECTION: Engaging introduction with clear learning objective and context
2. FOUNDATIONAL CONCEPTS: Deep explanation from first principles (300+ words)
3. STEP-BY-STEP METHODOLOGY: Detailed procedures and techniques (400+ words)  
4. WORKED EXAMPLES: Multiple complete examples with analysis (300+ words)
5. PRACTICAL APPLICATION: Hands-on implementation guide (200+ words)
6. EXPERT INSIGHTS: Advanced techniques and best practices (150+ words)
7. CASE STUDY: Real-world application with specific data and outcomes
8. IMPLEMENTATION CHECKLIST: Actionable steps for immediate application
9. TROUBLESHOOTING GUIDE: Common issues and solutions
10. NEXT STEPS: Clear path for continued learning and skill development

🎓 PEDAGOGICAL VALIDATION - CONTENT MUST:
- Enable skill acquisition, not just information transfer
- Provide enough detail for immediate practical application
- Include specific procedures, formulas, or methodologies
- Show complete problem-solving processes with reasoning
- Address common challenges and provide solutions
- Include expert-level insights and techniques
- Connect theory to practice with concrete examples
- Be comprehensive enough to replace textbook content

CRITICAL: Return ONLY the complete React component code. No JSON, no explanations, no markdown formatting.
COMPONENT NAME: GeneratedLessonContent
MINIMUM CONTENT: 1000+ words of instructional material within the component

Generate the comprehensive educational React component now:`;
      successMessage = `Phase content completed successfully`;
    }

    if (!prompt) {
      throw new Error(`Invalid phase specified: ${phase}`);
    }

    // Use the multi-key system with enhanced error handling
    const generatedContent = await callGeminiAPIWithMultipleKeys(prompt, phase);
    console.log(`📄 Generated content length for phase ${phase}:`, generatedContent.length);

    try {
      const parsedData = parseAIResponse(generatedContent);
      console.log(`✅ Phase ${phase} completed successfully with ${Object.keys(parsedData).length} response keys`);
      
      // Validate the generated data against limits
      if (courseLength === 'lesson') {
        const validation = validateGeneratedData(parsedData, phase, courseLength);
        if (!validation.valid) {
          console.error('❌ Generated data violates limits:', validation.error);
          throw new Error(validation.error || 'Generated data violates the defined limits');
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: successMessage,
          data: parsedData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } catch (parseError: unknown) {
      console.error(`❌ Failed to parse ${phase} response:`, parseError);
      console.error('📋 Raw content sample:', generatedContent.substring(0, 1000));
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse ${phase} content from AI response: ${errorMessage}`);
    }

  } catch (error: unknown) {
    console.error('Phased generation error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage || 'An unexpected error occurred during phased generation',
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
