
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Multi-API key implementation for AI content generation
async function callGeminiAPIWithMultipleKeys(prompt: string, editType: string): Promise<any> {
  const apiKeys = [];
  
  let currentKey = Deno.env.get('GOOGLE_API_KEY');
  if (currentKey) apiKeys.push(currentKey);
  
  let keyIndex = 2;
  while (keyIndex <= 40) {
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
      console.log(`📡 Attempting Gemini API call with key ${keyNumber} for edit type: ${editType}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased timeout to 45 seconds

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
              maxOutputTokens: 8192, // Increased output tokens
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

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const name = error instanceof Error ? error.name : 'UnknownError';
      console.error(`💥 Error with API key ${keyNumber}:`, message);
      
      if (name === 'AbortError') {
        console.log(`⏰ Timeout with API key ${keyNumber}, trying next key...`);
        continue;
      }
      
      if (message.includes('429') && i < apiKeys.length - 1) {
        console.log(`🔄 Trying next API key due to quota exhaustion...`);
        continue;
      }
      
      if (i === apiKeys.length - 1) {
        throw new Error(`All API keys exhausted or failed. Last error: ${message}`);
      }
    }
  }

  throw new Error('All API keys failed');
}

// Enhanced JSON parsing with more robust error handling
function parseAIResponse(content: string): any {
  console.log('📄 Raw AI response length:', content.length);
  console.log('📄 Raw AI response sample:', content.substring(0, 200));
  
  let cleanedContent = content.trim();
  
  // Remove markdown formatting
  cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Find JSON boundaries more carefully
  const firstBrace = cleanedContent.indexOf('{');
  const lastBrace = cleanedContent.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    console.error('No valid JSON structure found in response');
    throw new Error('No valid JSON structure found in response');
  }
  
  let jsonContent = cleanedContent.substring(firstBrace, lastBrace + 1);
  console.log('📄 Extracted JSON length:', jsonContent.length);
  
  try {
    return JSON.parse(jsonContent);
  } catch (firstError) {
    console.log('First parse attempt failed, applying comprehensive cleanup...');
    const firstMessage = firstError instanceof Error ? firstError.message : String(firstError);
    console.log('First error:', firstMessage);
    
    try {
      // More comprehensive cleanup
      jsonContent = jsonContent
        // Fix common operator issues
        .replace(/\+ operator/g, 'plus operator')
        .replace(/\* operator/g, 'multiplication operator')
        .replace(/\/ operator/g, 'division operator')
        .replace(/\- operator/g, 'minus operator')
        // Fix line breaks and special characters
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        // Fix quotes
        .replace(/([^\\])"/g, '$1\\"')
        .replace(/^"/, '\\"')
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix malformed arrays
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        // Fix incomplete arrays/objects
        .replace(/,\s*$/, '');
      
      // Try to fix incomplete JSON by adding missing closing brackets
      let openBraces = 0;
      let openBrackets = 0;
      for (let i = 0; i < jsonContent.length; i++) {
        if (jsonContent[i] === '{') openBraces++;
        if (jsonContent[i] === '}') openBraces--;
        if (jsonContent[i] === '[') openBrackets++;
        if (jsonContent[i] === ']') openBrackets--;
      }
      
      // Add missing closing brackets
      while (openBrackets > 0) {
        jsonContent += ']';
        openBrackets--;
      }
      while (openBraces > 0) {
        jsonContent += '}';
        openBraces--;
      }
      
      console.log('📄 After cleanup, JSON length:', jsonContent.length);
      return JSON.parse(jsonContent);
      
    } catch (secondError) {
      console.log('Second parse attempt failed, trying character-by-character validation...');
      const secondMessage = secondError instanceof Error ? secondError.message : String(secondError);
      console.log('Second error:', secondMessage);
      
      try {
        // Find the last valid JSON position
        let validJson = '';
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < jsonContent.length; i++) {
          const char = jsonContent[i];
          
          if (escapeNext) {
            validJson += char;
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            validJson += char;
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            validJson += char;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
              validJson += char;
            } else if (char === '}') {
              braceCount--;
              validJson += char;
              if (braceCount === 0) {
                // We have a complete JSON object
                break;
              }
            } else {
              validJson += char;
            }
          } else {
            validJson += char;
          }
        }
        
        console.log('📄 Valid JSON extracted length:', validJson.length);
        return JSON.parse(validJson);
        
      } catch (thirdError) {
        console.error('All JSON parsing attempts failed');
        const firstMessage = firstError instanceof Error ? firstError.message : String(firstError);
        const secondMessage = secondError instanceof Error ? secondError.message : String(secondError);
        const thirdMessage = thirdError instanceof Error ? thirdError.message : String(thirdError);
        console.error('Original error:', firstMessage);
        console.error('Cleanup error:', secondMessage);
        console.error('Validation error:', thirdMessage);
        console.error('Problematic content sample:', jsonContent.substring(0, 1000));
        
        throw new Error(`Failed to parse AI response as JSON. Multiple attempts failed. Original error: ${firstMessage}`);
      }
    }
  }
}

serve(async (req) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edit-course function started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log('📥 Request received:', Object.keys(requestBody));

    const { 
      userId, 
      courseId, 
      editType, 
      editRequest, 
      targetPath,
      currentContent,
      additionalContext 
    } = requestBody;
    
    console.log(`🚀 EduPerfect course editing - Edit Type: ${editType}`, { 
      userId, 
      courseId, 
      editType,
      targetPath,
      timestamp: new Date().toISOString()
    });

    if (!userId || !courseId || !editType || !editRequest) {
      throw new Error('Missing required parameters: userId, courseId, editType, or editRequest');
    }

    // Verify user owns the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('user_id', userId)
      .single();

    if (courseError || !course) {
      console.error('🛑 Course not found or access denied');
      throw new Error('Course not found or access denied');
    }

    console.log('✅ Course access verified');

    let prompt = '';
    let responseData = {};

    switch (editType) {
      case 'add_modules':
        prompt = `You are EduPerfect course editor. The user wants to add more modules to their course.

Current Course: ${course.title}
Edit Request: ${editRequest}
Target Location: ${targetPath || 'General course'}
Current Content Structure: ${JSON.stringify(currentContent, null, 2)}

🎯 TASK: ADD MORE MODULES

Based on the user's request, generate additional modules that:
- Fit seamlessly with the existing course structure
- Follow the same educational quality and depth
- Complement the existing modules without duplication
- Match the course's learning objectives and style

User's specific request: "${editRequest}"

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.

{
  "newModules": [
    {
      "title": "New Module Title",
      "description": "Comprehensive description of what this module teaches",
      "learningObjective": "Specific skill or knowledge the student will gain",
      "estimatedDuration": "X minutes",
      "contentType": "theory/practical/exercise",
      "difficulty": "beginner/intermediate/advanced",
      "keyTakeaways": ["Essential concept 1", "Essential concept 2", "Essential concept 3"],
      "content": {
        "introduction": "Engaging introduction",
        "mainContent": "Detailed educational content with examples",
        "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
        "realWorldExamples": [
          {
            "title": "Example Title",
            "description": "Detailed scenario",
            "outcome": "What this demonstrates"
          }
        ],
        "practicalApplication": "How to apply this knowledge",
        "knowledgeCheck": {
          "question": "Assessment question",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Why this answer is correct"
        }
      }
    }
  ]
}`;
        break;

      case 'edit_content':
        prompt = `You are EduPerfect content editor. The user wants to modify existing course content.

Current Course: ${course.title}
Edit Request: ${editRequest}
Target Content Location: ${targetPath || 'General course content'}
Current Content: ${JSON.stringify(currentContent, null, 2)}
Additional Context: ${additionalContext || 'None provided'}

🎯 TASK: EDIT EXISTING CONTENT

Based on the user's request, modify the existing content to:
- Address the specific changes requested
- Maintain educational quality and coherence
- Keep the same learning objectives unless specifically changed
- Preserve the overall structure while making requested improvements

User's specific request: "${editRequest}"

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting. Ensure all strings are properly escaped and all JSON is valid.

{
  "updatedCourse": {
    "title": "${course.title}",
    "description": "Updated description if needed otherwise keep original",
    "difficulty_level": "${course.difficulty_level}",
    "estimated_duration": "${course.estimated_duration}",
    "topics": [
      {
        "title": "Updated or original topic title",
        "description": "Updated or original topic description",
        "learningObjectives": ["Updated objective 1", "Updated objective 2"],
        "estimatedDuration": "Updated duration",
        "difficulty": "beginner",
        "subtopics": [
          {
            "title": "Updated subtopic title",
            "description": "Updated subtopic description",
            "micro_modules": [
              {
                "title": "Updated module title",
                "description": "Updated module description",
                "content": "Updated detailed content"
              }
            ]
          }
        ]
      }
    ]
  }
}`;
        break;

      case 'restructure':
        prompt = `You are EduPerfect course architect. The user wants to restructure their course.

Current Course: ${course.title}
Edit Request: ${editRequest}
Current Structure: ${JSON.stringify(course.topics, null, 2)}
Additional Context: ${additionalContext || 'None provided'}

🎯 TASK: RESTRUCTURE COURSE

Based on the user's request, restructure the course to:
- Improve learning flow and progression
- Better organize content according to user's vision
- Maintain all valuable content while reorganizing
- Ensure logical learning sequence

User's specific request: "${editRequest}"

CRITICAL: Respond with ONLY valid JSON. No additional text, explanations, or markdown formatting.

{
  "restructuredCourse": {
    "title": "Updated course title if needed",
    "description": "Updated course description if needed",
    "difficulty_level": "${course.difficulty_level}",
    "estimated_duration": "Updated duration if needed",
    "topics": [
      {
        "title": "Restructured Topic Title",
        "description": "Topic description",
        "learningObjectives": ["Objective 1", "Objective 2"],
        "estimatedDuration": "Duration",
        "subtopics": [
          {
            "title": "Restructured Subtopic Title",
            "description": "Subtopic description",
            "micro_modules": [
              {
                "title": "Module Title",
                "description": "Module description",
                "content": "Module content"
              }
            ]
          }
        ]
      }
    ]
  }
}`;
        break;

      default:
        throw new Error(`Invalid edit type: ${editType}`);
    }

    console.log('🤖 Calling AI with prompt length:', prompt.length);

    // Generate AI response
    const generatedContent = await callGeminiAPIWithMultipleKeys(prompt, editType);
    console.log(`📄 Generated content length for edit type ${editType}:`, generatedContent.length);

    try {
      responseData = parseAIResponse(generatedContent);
      console.log(`✅ Edit ${editType} completed successfully`);
    } catch (parseError) {
      console.error(`❌ Failed to parse ${editType} response:`, parseError);
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse ${editType} content from AI response: ${message}`);
    }

    // Update the course in database based on edit type
    let updatedCourse = { ...course };
    
    switch (editType) {
      case 'add_modules':
        // For add_modules, we'll return the new modules for the client to handle
        console.log('📦 New modules generated:', (responseData as any).newModules?.length || 0);
        break;
        
      case 'edit_content':
        if ((responseData as any).updatedCourse) {
          updatedCourse = {
            ...updatedCourse,
            ...(responseData as any).updatedCourse,
            updated_at: new Date().toISOString()
          };
        }
        break;
        
      case 'restructure':
        if ((responseData as any).restructuredCourse) {
          updatedCourse = {
            ...updatedCourse,
            ...(responseData as any).restructuredCourse,
            updated_at: new Date().toISOString()
          };
        }
        break;
    }

    // Save updated course to database
    const { error: updateError } = await supabase
      .from('courses')
      .update({
        title: updatedCourse.title,
        description: updatedCourse.description,
        topics: updatedCourse.topics,
        difficulty_level: updatedCourse.difficulty_level,
        estimated_duration: updatedCourse.estimated_duration,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Course update error:', updateError);
      throw new Error(`Failed to update course: ${updateError.message}`);
    }

    console.log('💾 Course updated in database successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        editType,
        message: `Course ${editType.replace('_', ' ')} completed successfully`,
        updatedCourse,
        ...responseData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('💥 Course edit error:', message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message || 'An unexpected error occurred during course editing',
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
