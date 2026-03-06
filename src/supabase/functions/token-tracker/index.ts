import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Estimate tokens from text (1 token ≈ 4 characters)
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, userId, tokens, operationType, courseId, sessionId, metadata } = await req.json();
    if (action === 'check') {
      // Check if user has enough tokens
      const { data: hasEnough, error: checkError } = await supabase.rpc('check_token_limit', {
        target_user_id: userId,
        required_tokens: tokens
      });
      if (checkError) {
        throw new Error(`Token check failed: ${checkError.message}`);
      }
      return new Response(JSON.stringify({
        success: true,
        hasEnoughTokens: hasEnough,
        message: hasEnough ? 'Sufficient tokens available' : 'Token limit exceeded'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (action === 'log') {
      // Log token usage
      const { error: logError } = await supabase.rpc('log_token_usage', {
        target_user_id: userId,
        tokens: tokens,
        operation: operationType,
        target_course_id: courseId || null,
        target_session_id: sessionId || null,
        extra_metadata: metadata || {}
      });
      if (logError) {
        throw new Error(`Token logging failed: ${logError.message}`);
      }
      return new Response(JSON.stringify({
        success: true,
        message: 'Token usage logged successfully'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (action === 'estimate') {
      // Estimate tokens from text
      const { text } = await req.json();
      const estimatedTokens = estimateTokens(text);
      return new Response(JSON.stringify({
        success: true,
        estimatedTokens
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    throw new Error('Invalid action specified');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Token tracker error:', message);
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
