import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Enhanced JSON parsing with much better error handling
function parseAIResponse(content) {
  console.log('Raw AI response length:', content.length);
  // Remove any markdown code blocks
  let cleanedContent = content.trim();
  cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Find the first { and last } to extract only the JSON part
  const firstBrace = cleanedContent.indexOf('{');
  const lastBrace = cleanedContent.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error('No valid JSON structure found in response');
  }
  let jsonContent = cleanedContent.substring(firstBrace, lastBrace + 1);
  console.log('Extracted JSON preview:', jsonContent.substring(0, 200) + '...');
  // First attempt: try parsing as-is
  try {
    return JSON.parse(jsonContent);
  } catch (firstError) {
    console.log('First parse attempt failed, trying comprehensive cleanup...');
    // Comprehensive content sanitization
    try {
      // Step 1: Fix common operator issues that break JSON
      jsonContent = jsonContent.replace(/\+ operator/g, 'plus operator');
      jsonContent = jsonContent.replace(/\* operator/g, 'multiplication operator');
      jsonContent = jsonContent.replace(/\/ operator/g, 'division operator');
      jsonContent = jsonContent.replace(/\- operator/g, 'minus operator');
      // Step 2: Fix unescaped quotes in content strings
      jsonContent = jsonContent.replace(/"([^"]*)":\s*"([^"]*(?:[^"\\]|\\.)*)"/g, (match, key, value)=>{
        const cleanValue = value.replace(/\\"/g, '___ESCAPED_QUOTE___').replace(/"/g, '\\"').replace(/___ESCAPED_QUOTE___/g, '\\"');
        return `"${key}": "${cleanValue}"`;
      });
      // Step 3: Handle newlines and tabs in strings
      jsonContent = jsonContent.replace(/\n/g, '\\n');
      jsonContent = jsonContent.replace(/\r/g, '\\r');
      jsonContent = jsonContent.replace(/\t/g, '\\t');
      // Step 4: Fix trailing commas
      jsonContent = jsonContent.replace(/,(\s*[}\]])/g, '$1');
      console.log('Attempting parse after comprehensive cleanup...');
      return JSON.parse(jsonContent);
    } catch (secondError) {
      console.log('Second parse attempt failed, trying fallback extraction...');
      // Final fallback: Extract and reconstruct the JSON manually
      try {
        const result = {};
        // For content phase, try to extract content object
        if (jsonContent.includes('"content"')) {
          const contentMatch = jsonContent.match(/"content"\s*:\s*\{(.*?)\}/s);
          if (contentMatch) {
            result.content = {};
            console.log('Fallback extraction for content phase');
            return result;
          }
        }
        // For modules phase, try to extract modules array
        if (jsonContent.includes('"modules"')) {
          const modulesMatch = jsonContent.match(/"modules"\s*:\s*\[(.*?)\]/s);
          if (modulesMatch) {
            const modulesContent = modulesMatch[1];
            const modules = [];
            const moduleMatches = modulesContent.split(/(?=\{\s*"title")/);
            for (const moduleStr of moduleMatches){
              if (moduleStr.trim()) {
                try {
                  const module = {};
                  const titleMatch = moduleStr.match(/"title"\s*:\s*"([^"]+)"/);
                  if (titleMatch) module.title = titleMatch[1];
                  const descMatch = moduleStr.match(/"description"\s*:\s*"([^"]+)"/);
                  if (descMatch) module.description = descMatch[1].replace(/\\\"/g, '"');
                  const objMatch = moduleStr.match(/"learningObjective"\s*:\s*"([^"]+)"/);
                  if (objMatch) module.learningObjective = objMatch[1];
                  const durMatch = moduleStr.match(/"estimatedDuration"\s*:\s*"([^"]+)"/);
                  if (durMatch) module.estimatedDuration = durMatch[1];
                  const typeMatch = moduleStr.match(/"contentType"\s*:\s*"([^"]+)"/);
                  if (typeMatch) module.contentType = typeMatch[1];
                  if (module.title) {
                    modules.push(module);
                  }
                } catch (moduleError) {
                  console.log('Error parsing individual module, skipping...');
                }
              }
            }
            if (modules.length > 0) {
              result.modules = modules;
              console.log(`Fallback extraction successful: ${modules.length} modules extracted`);
              return result;
            }
          }
        }
        // For other phases, try similar extraction patterns
        if (jsonContent.includes('"topics"')) {
          const topicsMatch = jsonContent.match(/"topics"\s*:\s*\[(.*?)\]/s);
          if (topicsMatch) {
            result.topics = [];
            console.log('Fallback extraction for topics phase');
            return result;
          }
        }
        if (jsonContent.includes('"subtopics"')) {
          const subtopicsMatch = jsonContent.match(/"subtopics"\s*:\s*\[(.*?)\]/s);
          if (subtopicsMatch) {
            result.subtopics = [];
            console.log('Fallback extraction for subtopics phase');
            return result;
          }
        }
        throw new Error('Fallback extraction failed');
      } catch (thirdError) {
        console.error('All JSON parsing attempts failed');
        const firstErrorMessage = firstError instanceof Error ? firstError.message : String(firstError);
        const secondErrorMessage = secondError instanceof Error ? secondError.message : String(secondError);
        const thirdErrorMessage = thirdError instanceof Error ? thirdError.message : String(thirdError);
        console.error('Original error:', firstErrorMessage);
        console.error('Cleanup error:', secondErrorMessage);
        console.error('Fallback error:', thirdErrorMessage);
        console.error('Problematic content sample:', jsonContent.substring(0, 500));
        throw new Error(`Failed to parse AI response as JSON. Original error: ${firstErrorMessage}`);
      }
    }
  }
}
// Multi-API key implementation with automatic rotation
async function callGeminiAPIWithMultipleKeys(prompt, phase, supabase, userId, sessionId) {
  // Collect all available API keys from environment variables
  const apiKeys = [];
  let currentKey = Deno.env.get('GOOGLE_API_KEY');
  if (currentKey) apiKeys.push(currentKey);
  let keyIndex = 2;
  while(true){
    const nextKey = Deno.env.get(`GOOGLE_API_KEY_${keyIndex}`);
    if (!nextKey) break;
    apiKeys.push(nextKey);
    keyIndex++;
  }
  if (apiKeys.length === 0) {
    throw new Error('No Google API keys configured');
  }
  console.log(`🔑 Available API keys: ${apiKeys.length}`);
  // Check token limit before making API call
  const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(supabase, userId, prompt, 2000, `course_generation_${phase}`, undefined, sessionId);
  if (!canProceed) {
    throw new Error(JSON.stringify({
      error: 'Token limit exceeded',
      tokensNeeded,
      tokensRemaining,
      upgradeRequired: true
    }));
  }
  console.log(`✅ Token check passed. Remaining: ${tokensRemaining}`);
  for(let i = 0; i < apiKeys.length; i++){
    const apiKey = apiKeys[i];
    const keyNumber = i + 1;
    try {
      console.log(`📡 Attempting Gemini API call with key ${keyNumber} for phase: ${phase}`);
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: "application/json"
          }
        })
      });
      if (geminiResponse.ok) {
        console.log(`✅ Success with API key ${keyNumber}`);
        const geminiData = await geminiResponse.json();
        if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
          throw new Error('Invalid response structure from Gemini API');
        }
        const responseText = geminiData.candidates[0].content.parts[0].text;
        // Log actual token usage
        await logActualUsage(supabase, userId, responseText, `course_generation_${phase}`, undefined, sessionId, {
          apiKeyUsed: keyNumber,
          model: 'gemini-2.0-flash',
          phase
        });
        return responseText;
      }
      // Handle different types of errors
      const errorText = await geminiResponse.text();
      console.error(`❌ API key ${keyNumber} failed:`, geminiResponse.status, errorText);
      if (geminiResponse.status === 429) {
        console.log(`🔄 Quota exceeded for key ${keyNumber}, trying next key...`);
        continue;
      } else {
        throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`💥 Error with API key ${keyNumber}:`, errorMessage);
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
// Get flexible course guidelines based on time constraints, not rigid limits
function getCourseGuidelines(courseLength) {
  switch(courseLength){
    case 'lesson':
      return {
        timeTarget: '15-30 minutes',
        depthLevel: 'Essential concepts only',
        contentFocus: 'Core fundamentals with minimal branching',
        suggestedApproach: 'Prioritize immediate applicability and key takeaways',
        description: 'Quick Lesson: Focus on essential concepts that can be learned immediately'
      };
    case 'short':
      return {
        timeTarget: '1-3 hours',
        depthLevel: 'Overview with practical examples',
        contentFocus: 'Main concepts with some supporting details and examples',
        suggestedApproach: 'Balance theory with hands-on practice, focus on most important skills',
        description: 'Short Course: Comprehensive overview with practical application'
      };
    case 'standard':
      return {
        timeTarget: '4-10 hours',
        depthLevel: 'Comprehensive coverage with depth',
        contentFocus: 'Full topic coverage with detailed explanations, examples, and practice',
        suggestedApproach: 'Build systematic understanding from basics to intermediate/advanced concepts',
        description: 'Standard Course: Complete learning path with thorough understanding'
      };
    case 'comprehensive':
      return {
        timeTarget: '10+ hours',
        depthLevel: 'Mastery-level with extensive practice',
        contentFocus: 'Deep expertise with advanced applications, edge cases, and real-world scenarios',
        suggestedApproach: 'Build expert-level understanding with practical mastery and advanced applications',
        description: 'Comprehensive Course: Expert-level mastery with extensive practical application'
      };
    default:
      return {
        timeTarget: '4-8 hours',
        depthLevel: 'Comprehensive coverage',
        contentFocus: 'Complete topic coverage with practical application',
        suggestedApproach: 'Balance comprehensive understanding with practical skills',
        description: 'Standard Course: Complete learning experience'
      };
  }
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { userId, sessionId, phase, formData, topicData, subtopicData, moduleData } = await req.json();
    console.log(`🚀 EduPerfect flexible phased generation - Phase: ${phase}`, {
      userId,
      sessionId,
      phase,
      courseLength: formData.courseLength,
      timestamp: new Date().toISOString()
    });
    // Verify session exists and is active
    const { data: session, error: sessionError } = await supabase.from('generation_sessions').select('*').eq('id', sessionId).eq('user_id', userId).eq('status', 'active').single();
    if (sessionError || !session) {
      console.error('🛑 Generation session cancelled or not found, aborting...');
      throw new Error('Generation session not found or cancelled');
    }
    // Get flexible course guidelines instead of rigid constraints
    const guidelines = getCourseGuidelines(formData.courseLength);
    console.log(`📏 Course guidelines for ${formData.courseLength}:`, guidelines);
    let prompt = '';
    let responseData = {};
    switch(phase){
      case 'topics':
        prompt = `You are EduPerfect, the ultimate learning system. Generate high-level topics for a comprehensive course on "${formData.skill || 'General Learning'}".

Course Guidelines: ${guidelines.description}
Time Target: ${guidelines.timeTarget}
Depth Level: ${guidelines.depthLevel}
Content Focus: ${guidelines.contentFocus}

Student Profile:
- Subject: ${formData.skill || 'General Learning'}
- Purpose: ${formData.purpose || formData.motivation || 'Personal development'}
- Current Level: ${formData.currentLevel || 'Beginner'}/10
- Available Time: ${formData.dailyTime || '30 minutes'} daily
- Learning Style: ${formData.learningStyle || 'Mixed'}
- Age: ${formData.age || 'Adult'}
- Education: ${formData.educationalBackground || 'General'}
- Course Length: ${formData.courseLength || 'standard'}

🎯 PHASE 1: GENERATE OPTIMAL TOPIC STRUCTURE

Based on the subject complexity and time constraints, determine the ideal number of topics (typically 3-12 topics depending on subject depth needed). Each topic should:
- Be a major subject area within ${formData.skill}
- Follow logical learning progression from fundamentals to advanced
- Build upon previous topics systematically
- Be substantial enough to warrant detailed subtopic breakdown
- Cover theoretical foundations AND practical applications
- Match the ${guidelines.timeTarget} time target and ${guidelines.depthLevel} depth level

IMPORTANT: Let the subject matter and learning objectives guide the number of topics, not arbitrary limits. Some subjects need 3 comprehensive topics, others need 10+ focused topics.

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.
IMPORTANT: Avoid using operators like +, -, *, / in descriptions. Use words instead (plus, minus, multiply, divide).

{
  "topics": [
    {
      "title": "Topic Title",
      "description": "Comprehensive description covering what this topic teaches and why it matters",
      "learningObjectives": ["Detailed objective 1", "Detailed objective 2", "Detailed objective 3", "Detailed objective 4"],
      "estimatedDuration": "X hours",
      "difficulty": "beginner/intermediate/advanced",
      "prerequisites": ["Any required prior knowledge"]
    }
  ]
}`;
        break;
      case 'subtopics':
        if (!topicData || !topicData.title) {
          throw new Error('Topic data is required for subtopics generation. Please ensure topics phase completed successfully.');
        }
        prompt = `You are EduPerfect. Generate detailed subtopics for the topic: "${topicData.title}"

Course Guidelines: ${guidelines.description}
Time Target: ${guidelines.timeTarget}
Approach: ${guidelines.suggestedApproach}

Topic Description: ${topicData.description}
Topic Objectives: ${JSON.stringify(topicData.learningObjectives)}
Topic Duration: ${topicData.estimatedDuration}

🎯 PHASE 2: GENERATE OPTIMAL SUBTOPIC BREAKDOWN

For this topic, determine the ideal number of subtopics based on:
- Topic complexity and scope
- Learning objectives that need to be covered
- Time available within this topic
- Natural learning progression flow

Each subtopic should:
- Break down the topic into logical learning units
- Follow natural progression from basic to advanced concepts
- Be substantial enough to accommodate multiple focused learning modules
- Include both theoretical understanding AND practical application
- Build systematically toward topic mastery
- Match the overall course depth level: ${guidelines.depthLevel}

IMPORTANT: Let educational needs determine subtopic count, not arbitrary limits. Complex topics may need 8+ subtopics, simple topics may need only 2-3.

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.
IMPORTANT: Avoid using operators like +, -, *, / in descriptions. Use words instead (plus, minus, multiply, divide).

{
  "subtopics": [
    {
      "title": "Subtopic Title",
      "description": "Comprehensive description of what this subtopic covers in detail",
      "learningObjectives": ["Specific measurable objective 1", "Specific measurable objective 2", "Specific measurable objective 3"],
      "estimatedDuration": "X minutes",
      "difficulty": "beginner/intermediate/advanced",
      "prerequisites": ["Concepts that must be understood first"],
      "practicalApplications": ["Real-world use case 1", "Real-world use case 2"]
    }
  ]
}`;
        break;
      case 'modules':
        if (!subtopicData || !subtopicData.title) {
          throw new Error('Subtopic data is required for modules generation. Please ensure subtopics phase completed successfully.');
        }
        prompt = `You are EduPerfect. Generate comprehensive learning modules for the subtopic: "${subtopicData.title}"

Course Guidelines: ${guidelines.description}
Time Target: ${guidelines.timeTarget}
Content Focus: ${guidelines.contentFocus}
Suggested Approach: ${guidelines.suggestedApproach}

Subtopic Description: ${subtopicData.description}
Subtopic Objectives: ${JSON.stringify(subtopicData.learningObjectives)}
Subtopic Duration: ${subtopicData.estimatedDuration}

🎯 PHASE 3: GENERATE OPTIMAL MODULE STRUCTURE

Create the ideal number of focused learning modules based on:
- Subtopic complexity and learning objectives
- Natural breaking points in the subject matter
- Optimal learning chunk size (typically 5-25 minutes per module depending on course length)
- Practical vs theoretical balance needed
- Hands-on practice requirements

Each module should:
- Teach one specific concept or skill in depth
- Be digestible in a single focused study session
- Include both conceptual understanding AND hands-on practice
- Build systematically toward subtopic mastery
- Include practical exercises and real-world applications
- Match the course depth: ${guidelines.depthLevel}

IMPORTANT: Let learning effectiveness determine module count. Some subtopics need 2 focused modules, others need 8+ detailed modules.

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.
IMPORTANT: Avoid using operators like +, -, *, / in descriptions. Use words instead (plus, minus, multiply, divide).
IMPORTANT: Keep descriptions comprehensive but avoid complex punctuation or quotes.

{
  "modules": [
    {
      "title": "Module Title",
      "description": "Comprehensive description of what this module teaches and how it applies",
      "learningObjective": "Specific, measurable skill or knowledge the student will gain",
      "estimatedDuration": "X minutes",
      "contentType": "theory/practical/exercise/project",
      "difficulty": "beginner/intermediate/advanced",
      "keyTakeaways": ["Essential concept 1", "Essential concept 2", "Essential concept 3"]
    }
  ]
}`;
        break;
      case 'content':
        prompt = `You are EduPerfect. Generate comprehensive, high-quality educational content for the module: "${moduleData.title}"

Course Guidelines: ${guidelines.description}
Time Target: ${guidelines.timeTarget}
Content Depth: ${guidelines.depthLevel}
Content Focus: ${guidelines.contentFocus}

Module Description: ${moduleData.description}
Learning Objective: ${moduleData.learningObjective}
Content Type: ${moduleData.contentType}
Module Duration: ${moduleData.estimatedDuration}
Key Takeaways: ${JSON.stringify(moduleData.keyTakeaways)}

🎯 PHASE 4: GENERATE HIGH-QUALITY EDUCATIONAL CONTENT

Create comprehensive educational content that matches the course depth level and time target. Content should include:
- Detailed explanations with multiple real-world examples
- Step-by-step breakdowns of complex concepts
- Practical applications with specific scenarios
- Interactive elements and thought experiments
- Knowledge check with thoughtful assessment questions
- Content depth appropriate for: ${guidelines.depthLevel}

IMPORTANT: Generate content that fully utilizes the allocated module time (${moduleData.estimatedDuration}). Don't artificially limit content if the module duration supports more comprehensive coverage.

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.
IMPORTANT: For HTML content in strings, use single quotes for HTML attributes to avoid JSON parsing issues.
IMPORTANT: Avoid using operators like +, -, *, / in text. Use words instead (plus, minus, multiply, divide).
IMPORTANT: Create substantial, high-quality content that provides real educational value matching the course depth level.

{
  "content": {
    "introduction": "Engaging, comprehensive introduction that hooks the learner and explains the importance",
    "mainContent": "Detailed educational content with multiple examples, step-by-step explanations, and rich formatting using HTML with single quotes for attributes. Include substantial paragraphs with concrete examples and practical applications that match the course depth level.",
    "keyPoints": ["Crucial concept 1 with explanation", "Crucial concept 2 with explanation", "Crucial concept 3 with explanation", "Crucial concept 4 with explanation"],
    "realWorldExamples": [
      {
        "title": "Example 1 Title",
        "description": "Detailed real-world scenario showing practical application",
        "outcome": "What this example demonstrates"
      },
      {
        "title": "Example 2 Title", 
        "description": "Another detailed real-world scenario",
        "outcome": "Key learning from this example"
      }
    ],
    "practicalApplication": "Comprehensive guide on how to immediately apply this knowledge in real situations, with specific steps and considerations",
    "quickQuiz": {
      "question": "Content-specific question that tests understanding of the actual material covered in this module (never use 'What is covered in' or generic phrases)",
      "options": ["Specific, realistic option A based on module content", "Specific, realistic option B based on module content", "Specific, realistic option C based on module content", "Specific, realistic option D based on module content"],
      "correct": 0,
      "explanation": "Detailed explanation connecting the correct answer to the specific content taught in this module"
    },
    "nextSteps": "Clear guidance on how this knowledge connects to upcoming topics and how to continue building expertise"
  }
}`;
        break;
      default:
        throw new Error('Invalid phase specified');
    }
    // Update session activity
    await supabase.from('generation_sessions').update({
      last_activity: new Date().toISOString()
    }).eq('id', sessionId);
    // Use the multi-key system
    const generatedContent = await callGeminiAPIWithMultipleKeys(prompt, phase, supabase, userId, sessionId);
    console.log(`📄 Generated content length for phase ${phase}:`, generatedContent.length);
    try {
      responseData = parseAIResponse(generatedContent);
      console.log(`✅ Phase ${phase} completed successfully with ${Object.keys(responseData).length} response keys`);
    } catch (parseError) {
      console.error(`❌ Failed to parse ${phase} response:`, parseError);
      console.error('Raw content sample:', generatedContent.substring(0, 1000));
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse ${phase} content from AI response: ${errorMessage}`);
    }
    // Update session with phase data
    const currentPhasesData = session.phases_data || [];
    currentPhasesData.push({
      phase,
      data: responseData,
      completedAt: new Date().toISOString()
    });
    await supabase.from('generation_sessions').update({
      phases_data: currentPhasesData,
      current_phase: [
        'topics',
        'subtopics',
        'modules',
        'content',
        'finalize'
      ].indexOf(phase) + 1,
      last_activity: new Date().toISOString()
    }).eq('id', sessionId);
    return new Response(JSON.stringify({
      success: true,
      phase,
      sessionId,
      guidelines,
      ...responseData,
      message: `Phase ${phase} completed successfully for ${guidelines.description}`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 Function error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({
      error: errorMessage || 'An unexpected error occurred',
      details: String(error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
