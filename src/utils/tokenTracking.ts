/**
 * Token tracking utilities for Gemini API usage
 * 
 * Approximation: 1 token ≈ 4 characters
 * 100 tokens ≈ 60-80 English words
 */

export const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count from text
 * Uses the approximation: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate tokens from JSON data
 */
export function estimateTokensFromJSON(data: any): number {
  const jsonString = JSON.stringify(data);
  return estimateTokens(jsonString);
}

/**
 * Calculate total tokens for a request (prompt + expected response)
 */
export function estimateRequestTokens(
  prompt: string,
  expectedResponseLength: number = 2000 // Default expected response
): number {
  const promptTokens = estimateTokens(prompt);
  const responseTokens = Math.ceil(expectedResponseLength / CHARS_PER_TOKEN);
  return promptTokens + responseTokens;
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Calculate approximate cost based on token count
 * (You can adjust these rates based on actual Gemini pricing)
 */
export function estimateCost(tokens: number, model: string = 'gemini-2.0-flash-exp'): number {
  // Example rates (adjust to actual pricing)
  const rates: Record<string, number> = {
    'gemini-2.0-flash-exp': 0.000001, // $1 per 1M tokens
    'gemini-1.5-flash': 0.000001,
    'gemini-1.5-pro': 0.000003,
  };
  
  const rate = rates[model] || rates['gemini-2.0-flash-exp'];
  return tokens * rate;
}

/**
 * Get token usage color based on percentage
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-destructive';
  if (percentage >= 75) return 'text-warning';
  return 'text-success';
}

/**
 * Calculate words from tokens
 */
export function tokensToWords(tokens: number): number {
  // Approximation: 100 tokens ≈ 70 words (average)
  return Math.ceil((tokens / 100) * 70);
}

/**
 * Calculate characters from tokens
 */
export function tokensToChars(tokens: number): number {
  return tokens * CHARS_PER_TOKEN;
}
