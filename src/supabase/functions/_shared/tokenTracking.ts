/**
 * Shared token tracking utilities for edge functions
 * Import this in any edge function that uses Gemini API
 */

// Token estimation (1 token ≈ 4 characters)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Check if user has enough tokens before making API call
export async function checkTokenLimit(
  supabase: any,
  userId: string,
  requiredTokens: number
): Promise<{ hasEnough: boolean; remaining: number }> {
  try {
    const { data, error } = await supabase.rpc('check_token_limit', {
      target_user_id: userId,
      required_tokens: requiredTokens
    });

    if (error) {
      console.error('Token limit check error:', error);
      return { hasEnough: false, remaining: 0 };
    }

    // Get remaining tokens
    const { data: usageData } = await supabase.rpc('get_user_token_usage', {
      target_user_id: userId
    });

    const remaining = usageData?.[0]?.tokens_remaining || 0;
    
    return { hasEnough: data, remaining };
  } catch (error) {
    console.error('Unexpected error checking token limit:', error);
    return { hasEnough: false, remaining: 0 };
  }
}

// Log token usage after API call
export async function logTokenUsage(
  supabase: any,
  userId: string,
  tokensUsed: number,
  operationType: string,
  courseId?: string,
  sessionId?: string,
  metadata?: any
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('log_token_usage', {
      target_user_id: userId,
      tokens: tokensUsed,
      operation: operationType,
      target_course_id: courseId || null,
      target_session_id: sessionId || null,
      extra_metadata: metadata || {}
    });

    if (error) {
      console.error('Token logging error:', error);
      return false;
    }

    console.log(`✅ Logged ${tokensUsed} tokens for ${operationType}`);
    return true;
  } catch (error) {
    console.error('Unexpected error logging tokens:', error);
    return false;
  }
}

// Complete token tracking workflow for Gemini API calls
export async function trackGeminiCall(
  supabase: any,
  userId: string,
  prompt: string,
  estimatedResponseTokens: number,
  operationType: string,
  courseId?: string,
  sessionId?: string
): Promise<{ canProceed: boolean; tokensNeeded: number; tokensRemaining: number }> {
  // Estimate tokens needed
  const promptTokens = estimateTokens(prompt);
  const totalTokensNeeded = promptTokens + estimatedResponseTokens;

  console.log(`📊 Token estimate for ${operationType}:`, {
    promptTokens,
    estimatedResponseTokens,
    totalTokensNeeded
  });

  // Check if user has enough tokens
  const { hasEnough, remaining } = await checkTokenLimit(
    supabase,
    userId,
    totalTokensNeeded
  );

  if (!hasEnough) {
    console.warn(`⚠️ Insufficient tokens for ${operationType}. Needed: ${totalTokensNeeded}, Remaining: ${remaining}`);
    return {
      canProceed: false,
      tokensNeeded: totalTokensNeeded,
      tokensRemaining: remaining
    };
  }

  console.log(`✅ Token check passed. Remaining after this call: ${remaining - totalTokensNeeded}`);
  
  return {
    canProceed: true,
    tokensNeeded: totalTokensNeeded,
    tokensRemaining: remaining
  };
}

// Log actual token usage after API response
export async function logActualUsage(
  supabase: any,
  userId: string,
  responseText: string,
  operationType: string,
  courseId?: string,
  sessionId?: string,
  additionalMetadata?: any
): Promise<void> {
  const tokensUsed = estimateTokens(responseText);
  
  await logTokenUsage(
    supabase,
    userId,
    tokensUsed,
    operationType,
    courseId,
    sessionId,
    {
      ...additionalMetadata,
      responseLength: responseText.length,
      timestamp: new Date().toISOString()
    }
  );
}
