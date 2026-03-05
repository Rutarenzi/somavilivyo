# Token Tracking Integration Guide

This guide shows how to integrate token tracking into your Gemini API edge functions.

## Overview

The token tracking system:
- ✅ Estimates tokens before API calls (1 token ≈ 4 characters)
- ✅ Checks user's remaining quota against subscription plan
- ✅ Blocks requests if limit exceeded
- ✅ Logs actual usage after successful calls
- ✅ Provides real-time usage dashboard for users

## Database Schema

Three main tables:
1. `subscription_plans` - Plan definitions with token limits
2. `user_token_usage` - Usage logs per user per month
3. `profiles.subscription_plan_id` - Links users to their plans

Default plans:
- **Free**: 50,000 tokens/month ($0)
- **Basic**: 200,000 tokens/month ($9.99)
- **Pro**: 1,000,000 tokens/month ($29.99)

## Integration Example

### Step 1: Import Utilities

```typescript
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';
```

### Step 2: Check Tokens Before API Call

```typescript
// Before making Gemini API call
const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(
  supabase,
  userId,
  prompt,
  2000, // Estimated response tokens
  'course_generation',
  courseId,
  sessionId
);

if (!canProceed) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Token limit exceeded',
      tokensNeeded,
      tokensRemaining,
      upgradeRequired: true
    }),
    {
      status: 402, // Payment Required
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
```

### Step 3: Make API Call

```typescript
// Make your Gemini API call as normal
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  }
);

const data = await response.json();
const responseText = data.candidates[0].content.parts[0].text;
```

### Step 4: Log Actual Usage

```typescript
// After successful API call
await logActualUsage(
  supabase,
  userId,
  responseText,
  'course_generation',
  courseId,
  sessionId,
  {
    apiKeyUsed: 1,
    model: 'gemini-2.0-flash-exp'
  }
);
```

## Complete Example

Here's a complete edge function with token tracking:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { trackGeminiCall, logActualUsage } from '../_shared/tokenTracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, prompt, courseId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // STEP 1: Check token limit
    const { canProceed, tokensNeeded, tokensRemaining } = await trackGeminiCall(
      supabase,
      userId,
      prompt,
      2000, // Estimated response size
      'course_generation',
      courseId
    );

    if (!canProceed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Token limit exceeded',
          tokensNeeded,
          tokensRemaining,
          upgradeRequired: true
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // STEP 2: Make API call
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;

    // STEP 3: Log actual usage
    await logActualUsage(
      supabase,
      userId,
      responseText,
      'course_generation',
      courseId,
      undefined,
      { model: 'gemini-2.0-flash-exp' }
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: responseText,
        tokensUsed: Math.ceil(responseText.length / 4)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

## Edge Functions to Update

Update these edge functions with token tracking:

1. ✅ `generate-course` - Course generation
2. ✅ `ui-shell-generator` - UI personalization
3. ✅ `curriculum-rag-generator` - Curriculum content
4. ✅ `generate-questions` - Question generation
5. ✅ `chatbot-ai` - AI chat interactions
6. ✅ `edit-course` - Course editing with AI

## Frontend Integration

The token usage is automatically displayed in the dashboard via `TokenUsageCard` component.

Users can:
- View current monthly usage
- See remaining tokens
- Get warnings when approaching limits
- See upgrade prompts when limit exceeded

## Testing

Test the token tracking:

```typescript
// Test token check
const { data } = await supabase.functions.invoke('token-tracker', {
  body: {
    action: 'check',
    userId: 'user-id',
    tokens: 5000
  }
});

// Test token logging
await supabase.functions.invoke('token-tracker', {
  body: {
    action: 'log',
    userId: 'user-id',
    tokens: 1000,
    operationType: 'test'
  }
});
```

## Error Handling

Always handle token limit errors:

```typescript
if (response.status === 402) {
  toast({
    title: "Token Limit Reached",
    description: "You've used all your monthly tokens. Upgrade to continue.",
    variant: "destructive"
  });
  // Redirect to upgrade page
  navigate('/settings?tab=subscription');
}
```

## Monitoring

Monitor token usage via:
1. Dashboard UI (`TokenUsageCard`)
2. Database queries to `user_token_usage`
3. Monthly summary view `user_monthly_token_summary`

## Next Steps

1. Update all edge functions to include token tracking
2. Add upgrade flow for users exceeding limits
3. Implement payment integration for plan upgrades
4. Set up email notifications for usage warnings
5. Add analytics dashboard for admin monitoring