import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    // Get authenticated user
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const userId = user.id;
    const { message, conversationHistory, courseContext, responseLengthPreference } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({
        error: 'Message is required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get all available API keys
    const apiKeys = [];
    let currentKey = Deno.env.get('GOOGLE_API_KEY');
    if (currentKey) apiKeys.push(currentKey);
    let keyIndex = 2;
    while(keyIndex <= 20){
      const nextKey = Deno.env.get(`GOOGLE_API_KEY_${keyIndex}`);
      if (!nextKey) break;
      apiKeys.push(nextKey);
      keyIndex++;
    }
    if (apiKeys.length === 0) {
      console.error('No GOOGLE_API_KEY configured in Supabase secrets.');
      return new Response(JSON.stringify({
        error: 'AI service temporarily unavailable. Missing API Key.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`🔑 Available API keys: ${apiKeys.length}`);
    // Clear and specific system instruction with conversation context awareness
    let systemInstruction = "You are a helpful and knowledgeable AI assistant. Your goal is to provide clear, educational responses in a conversational tone. ";
    systemInstruction += "IMPORTANT: You must maintain conversational continuity and context from previous messages. ";
    systemInstruction += "When a user asks a follow-up question, always consider the previous conversation context and build upon it. ";
    systemInstruction += "Never abandon the topic or context without the user explicitly changing the subject.\n\n";
    // CRITICAL: Clear format instructions
    systemInstruction += "RESPONSE FORMAT RULES:\n";
    systemInstruction += "1. If you want to include a quiz with your response, your ENTIRE response must be valid JSON with this exact structure:\n";
    systemInstruction += '{"response": "your educational content here", "quiz": {"question": "quiz question", "options": ["option1", "option2", "option3", "option4"], "correctAnswerIndex": 0, "explanation": "explanation text"}}\n';
    systemInstruction += "2. If you are NOT including a quiz, respond with ONLY plain text - no JSON, no special formatting, just your educational content.\n";
    systemInstruction += "3. NEVER mix formats - it's either pure JSON (with quiz) or pure text (without quiz).\n";
    systemInstruction += "4. Use markdown formatting in your text responses for better readability (code blocks, bold, etc.).\n\n";
    if (responseLengthPreference === 'short') {
      systemInstruction += "Keep your response concise and focused. ";
    } else {
      systemInstruction += "Provide a comprehensive and detailed response. ";
    }
    // Build conversation context
    let conversationContext = "";
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      conversationContext = "CONVERSATION HISTORY:\n";
      // Get last 8 messages for context (4 exchanges)
      const recentHistory = conversationHistory.slice(-8);
      recentHistory.forEach((msg, index)=>{
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationContext += `${role}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }
    let userPrompt = `${conversationContext}Current User Question: "${message}"\n\n`;
    if (courseContext) {
      userPrompt += "Course context:\n";
      if (courseContext.title) {
        userPrompt += `- Course: ${courseContext.title}\n`;
      }
      if (courseContext.topics && courseContext.topics.length > 0) {
        userPrompt += `- Topics: ${courseContext.topics.join(', ')}\n`;
      }
      if (courseContext.currentModuleContent) {
        userPrompt += `- Current focus: ${courseContext.currentModuleContent}\n`;
      }
      userPrompt += "\n";
    }
    const fullPrompt = `${systemInstruction}\n${userPrompt}`;
    console.log('🤖 Sending prompt with conversation context to Gemini');
    // Initialize Supabase client for token tracking with service role
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    // Check token limit before making API call
    const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(supabase, userId, fullPrompt, responseLengthPreference === 'short' ? 350 : 1500, 'chat_interaction', undefined, undefined);
    if (!canProceed) {
      return new Response(JSON.stringify({
        error: 'Token limit exceeded',
        tokensNeeded,
        tokensRemaining,
        upgradeRequired: true
      }), {
        status: 402,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`✅ Token check passed. Remaining: ${tokensRemaining}`);
    // Try API keys until one works
    let geminiResponse;
    let lastError;
    for(let i = 0; i < apiKeys.length; i++){
      const apiKey = apiKeys[i];
      const keyNumber = i + 1;
      try {
        console.log(`📡 Attempting API call with key ${keyNumber}`);
        geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
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
              maxOutputTokens: responseLengthPreference === 'short' ? 350 : 1500
            }
          })
        });
        if (geminiResponse.ok) {
          console.log(`✅ Success with API key ${keyNumber}`);
          break;
        }
        const errorBody = await geminiResponse.text();
        console.error(`❌ API key ${keyNumber} failed:`, geminiResponse.status, errorBody);
        if (geminiResponse.status === 429) {
          console.log(`🔄 Quota exceeded for key ${keyNumber}, trying next key...`);
          continue;
        } else {
          throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorBody}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`💥 Error with API key ${keyNumber}:`, message);
        lastError = error;
        if (message.includes('429') && i < apiKeys.length - 1) {
          console.log(`🔄 Trying next API key due to quota exhaustion...`);
          continue;
        }
        if (i === apiKeys.length - 1) {
          throw new Error(`All API keys exhausted or failed. Last error: ${message}`);
        }
      }
    }
    if (!geminiResponse || !geminiResponse.ok) {
      throw lastError || new Error('All API keys failed');
    }
    const geminiData = await geminiResponse.json();
    // Handle safety blocks
    if (geminiData.candidates && geminiData.candidates.length > 0) {
      const candidate = geminiData.candidates[0];
      if (candidate.finishReason === 'SAFETY') {
        console.warn('Gemini response blocked due to safety reasons');
        return new Response(JSON.stringify({
          response: "I apologize, but I cannot provide a response on this topic due to safety guidelines. Please try asking about something else.",
          quiz: null
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.warn('Gemini response missing content');
        return new Response(JSON.stringify({
          response: 'I apologize, but I received an empty response. Please try rephrasing your question.',
          quiz: null
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    const rawAiOutput = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    let aiResponseText = "I apologize, but I could not generate a response.";
    let aiQuizData = null;
    // Log actual token usage
    if (rawAiOutput) {
      await logActualUsage(supabase, userId, rawAiOutput, 'chat_interaction', undefined, undefined, {
        model: 'gemini-1.5-flash',
        responseLengthPreference,
        hasConversationHistory: !!(conversationHistory && conversationHistory.length > 0)
      });
    }
    if (rawAiOutput) {
      // Clean the raw output first
      const cleanedOutput = rawAiOutput.trim();
      // Try to parse as JSON first
      if (cleanedOutput.startsWith('{') && cleanedOutput.endsWith('}')) {
        try {
          const parsedOutput = JSON.parse(cleanedOutput);
          if (parsedOutput.response && typeof parsedOutput.response === 'string') {
            aiResponseText = parsedOutput.response;
            if (parsedOutput.quiz && typeof parsedOutput.quiz.question === 'string' && Array.isArray(parsedOutput.quiz.options) && typeof parsedOutput.quiz.correctAnswerIndex === 'number' && typeof parsedOutput.quiz.explanation === 'string') {
              aiQuizData = parsedOutput.quiz;
              console.log('Successfully parsed response with quiz');
            }
          } else {
            // Invalid JSON structure, treat as plain text
            aiResponseText = cleanedOutput;
            console.log('Invalid JSON structure, treating as plain text');
          }
        } catch (e) {
          // JSON parsing failed, treat as plain text
          aiResponseText = cleanedOutput;
          console.log('JSON parsing failed, treating as plain text');
        }
      } else {
        // Not JSON format, treat as plain text
        aiResponseText = cleanedOutput;
        console.log('Response is plain text format');
      }
    }
    console.log('Processed response length:', aiResponseText.length);
    if (aiQuizData) {
      console.log('Quiz included in response');
    }
    return new Response(JSON.stringify({
      response: aiResponseText,
      quiz: aiQuizData
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in chatbot-ai function:', message);
    return new Response(JSON.stringify({
      error: `Unable to process your request: ${message}`,
      quiz: null
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
