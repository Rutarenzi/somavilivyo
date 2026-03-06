import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get all available API keys
const getApiKeys = (): string[] => {
  const keys: string[] = [];
  const baseKey = Deno.env.get("GOOGLE_API_KEY");
  if (baseKey) keys.push(baseKey);

  for (let i = 2; i <= 20; i++) {
    const key = Deno.env.get(`GOOGLE_API_KEY_${i}`);
    if (key) keys.push(key);
  }
  console.log(`Found ${keys.length} Google API keys for content recovery.`);
  return keys;
};

// Generate comprehensive content for modules with incomplete content
function sanitizeComponentCode(code: string): string {
  if (!code) return '';
  let out = code;
  out = out.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();
  try {
    const maybe = JSON.parse(out);
    if (maybe && typeof maybe.component === 'string') out = maybe.component;
  } catch {}
  if (!/export\s+default/.test(out) && /function\s+LessonContent\s*\(/.test(out)) {
    out = out.replace(/^\s*function\s+LessonContent/, 'export default function LessonContent');
  }
  return out;
}

// Generate comprehensive content for modules with incomplete content
async function generateComprehensiveContent(moduleTitle: string, learningObjective: string): Promise<any> {
  const apiKeys = getApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('No Google API keys available for content generation');
  }

  const systemInstruction = `You are an advanced educational content AI. Generate React/JSX component code for dynamic lesson rendering.

CRITICAL OUTPUT FORMAT:
You must return ONLY a complete React component as a string that can be executed. 

COMPONENT REQUIREMENTS:
- Must be a default export function named LessonContent
- Use Tailwind CSS for ALL styling (no external CSS)
- Include engaging visual hierarchy with headers, cards, and sections
- Apply animations using Tailwind animate classes (animate-fade-in, animate-scale-in, etc.)
- Use semantic colors and spacing for excellent readability
- Be fully responsive and accessible
- Incorporate educational best practices

CONTENT STRUCTURE:
- Engaging title with proper styling
- Clear learning objective section
- Comprehensive main content (400+ words) with proper formatting
- Real-world examples in highlighted sections
- Key takeaways in a visually distinct list
- Interactive elements and call-to-action

STYLING GUIDELINES:
- Use color scheme: primary (#3b82f6), secondary (#10b981), accent (#8b5cf6)
- Apply proper typography hierarchy with appropriate font sizes
- Include visual separators, borders, and backgrounds
- Add appropriate spacing and padding
- Use icons or emojis for visual appeal

Example structure:
export default function LessonContent() {
  return (
    <div className="p-6 max-w-4xl mx-auto font-sans text-gray-800">
      {/* Your styled lesson content here */}
    </div>
  );
}

Your response MUST be executable React/JSX code only, no JSON wrapper, no explanations.`;

  const userPrompt = `Generate a complete React component for: "${moduleTitle}"
Learning Objective: ${learningObjective}

Create a visually engaging, educational component with comprehensive content, proper styling, animations, and interactive elements that teaches this topic effectively.`;

  const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;

  // Try with available API keys
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const apiKey = apiKeys[i];
      console.log(`Attempting content generation with API key ${i + 1}`);

      const response = await fetch(
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
                 maxOutputTokens: 3000,
                 responseMimeType: "text/plain", // Changed from JSON to plain text for React code
               },
             }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (rawContent) {
          const cleaned = sanitizeComponentCode(rawContent);
          // Validate that it looks like React component code
          if (cleaned.includes('export default function') && cleaned.includes('return (') && cleaned.length > 200) {
            console.log(`✅ Generated React component for ${moduleTitle}`);
            return cleaned; // Return the cleaned React component code
          }
        }
      }

      if (response.status === 429) {
        console.log(`Quota exceeded for key ${i + 1}, trying next...`);
        continue;
      }

      throw new Error(`API request failed: ${response.status}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error with API key ${i + 1}:`, message);
        if (i === apiKeys.length - 1) {
          throw new Error('All API keys failed for content generation');
        }
      }
  }

  throw new Error('Content generation failed with all available keys');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, userId, specificModuleId, forceRegeneration } = await req.json();
    
    console.log('🔄 Starting content recovery for course:', courseId);
    if (specificModuleId) {
      console.log('🎯 Targeting specific module:', specificModuleId);
    }
    if (forceRegeneration) {
      console.log('🔄 Force regeneration enabled');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find modules with incomplete content
    let modulesQuery = supabase
      .from('micro_modules')
      .select('*')
      .eq('course_id', courseId);
      
    if (specificModuleId) {
      modulesQuery = modulesQuery.eq('id', specificModuleId);
    }
    
    const { data: modules, error: fetchError } = await modulesQuery;

    if (fetchError) {
      throw new Error(`Failed to fetch modules: ${fetchError.message}`);
    }

    console.log(`Found ${modules?.length || 0} modules to check`);

    let recoveredCount = 0;
    const promises = [];

    for (const module of modules || []) {
      // Check if module needs content recovery (including generated_code)
      let needsRecovery = false;
      let currentContent = null;

      try {
        if (typeof module.content === 'string') {
          currentContent = JSON.parse(module.content);
        } else if (typeof module.content === 'object') {
          currentContent = module.content;
        }

        // Force regeneration if requested, or check if content is incomplete
        if (forceRegeneration) {
          needsRecovery = true;
          console.log(`🔄 Force regenerating content for module: ${module.title}`);
        } else if (!currentContent || 
            !currentContent.mainContent || 
            currentContent.mainContent.length < 200 ||
            !currentContent.quickQuiz ||
            !module.generated_code ||
            currentContent.mainContent.includes('Placeholder content') ||
            currentContent.mainContent.includes('Add specific content') ||
            currentContent.mainContent.includes('TODO:') ||
            currentContent.mainContent.includes('[Content to be generated]') ||
            currentContent.mainContent.includes('Generation might have been incomplete')) {
          needsRecovery = true;
          console.log(`Module "${module.title}" needs content recovery`);
        }
      } catch (error) {
        needsRecovery = true;
      }

      if (needsRecovery) {
        console.log(`Module "${module.title}" needs content recovery`);
        
        const recoveryPromise = generateComprehensiveContent(
          module.title,
          module.learning_objective
        ).then(async (componentCode) => {
          // Create proper fallback content instead of just JSON
          const properFallbackContent = `
            <div class="module-content">
              <h2>${module.title}</h2>
              <div class="learning-objective">
                <h3>Learning Objective</h3>
                <p>${module.learning_objective}</p>
              </div>
              <div class="content-section">
                <h3>Module Overview</h3>
                <p>This module focuses on ${module.title.toLowerCase()}. You will learn key concepts and practical applications related to this topic.</p>
                <p>The content covers fundamental principles and real-world examples to help you understand ${module.title.toLowerCase()} effectively.</p>
              </div>
              <div class="key-points">
                <h3>Key Learning Points</h3>
                <ul>
                  <li>Understanding the basics of ${module.title.toLowerCase()}</li>
                  <li>Practical applications and examples</li>
                  <li>Real-world scenarios and case studies</li>
                  <li>Best practices and important considerations</li>
                </ul>
              </div>
              <div class="summary">
                <h3>Summary</h3>
                <p>By completing this module, you will have gained valuable knowledge about ${module.title.toLowerCase()} and be able to apply these concepts in practical situations.</p>
              </div>
            </div>
          `;

          // Update module with ONLY the generated React component code
          const { error: updateError } = await supabase
            .from('micro_modules')
            .update({ 
              generated_code: JSON.stringify({ component: componentCode }),
              content: properFallbackContent, // Store as HTML string, not JSON
              updated_at: new Date().toISOString()
            })
            .eq('id', module.id);

          if (updateError) {
            console.error(`Failed to update module ${module.title}:`, updateError);
            return false;
          }

          console.log(`✅ Recovered React component for module: ${module.title}`);
          return true;
        }).catch(error => {
          console.error(`Failed to recover content for ${module.title}:`, error);
          return false;
        });

        promises.push(recoveryPromise);
      }
    }

    // Wait for all recovery operations
    const results = await Promise.all(promises);
    recoveredCount = results.filter(result => result === true).length;

    console.log(`🎉 Content recovery complete: ${recoveredCount} modules recovered`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Content recovery completed: ${recoveredCount} modules recovered`,
        recoveredCount,
        totalChecked: modules?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Content recovery error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: message || 'Content recovery failed',
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});