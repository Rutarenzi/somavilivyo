
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.9';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Optimized for maximum speed while maintaining quality
const MAX_CONCURRENT_REQUESTS = 20; // Significantly increased for ultra-fast parallel processing
const DELAY_BETWEEN_BATCHES_MS = 50; // Minimal delay to maximize speed
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout per individual request

// Utility function for async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, sessionId, tasks, formData } = await req.json();
    console.log(`[generate-course-parallel] Received ${tasks.length} tasks for session ${sessionId}. Max concurrency PER BATCH: ${MAX_CONCURRENT_REQUESTS}. Delay BETWEEN BATCHES: ${DELAY_BETWEEN_BATCHES_MS}ms.`);

    if (!userId || !sessionId || !tasks || !Array.isArray(tasks) || !formData) {
      throw new Error("Missing required parameters: userId, sessionId, tasks array, or formData.");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey);

    const allResults: any[] = [];
    for (let i = 0; i < tasks.length; i += MAX_CONCURRENT_REQUESTS) {
      const batchTasks = tasks.slice(i, i + MAX_CONCURRENT_REQUESTS);
      console.log(`[generate-course-parallel] Processing internal batch of ${batchTasks.length} tasks. Starting from index ${i}.`);

      const batchPromises = batchTasks.map(async (task) => {
        const { phase, additionalData, taskId } = task;
        console.log(`[generate-course-parallel] Invoking 'generate-course-phased' for task ${taskId} (Phase: ${phase})`);
        try {
          // Add timeout wrapper to prevent hanging requests
          const invokePromise = supabaseAdminClient.functions.invoke('generate-course-phased', {
            body: {
              userId,
              sessionId,
              phase,
              formData,
              ...additionalData,
            }
          });

          // Race between the actual request and a timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`)), REQUEST_TIMEOUT_MS)
          );

          const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;

          if (error) {
            console.error(`[generate-course-parallel] Error invoking 'generate-course-phased' for task ${taskId} (Phase: ${phase}):`, error.message);
            return { taskId, status: 'rejected', reason: `Edge Function returned error: ${error.message}`, phase, additionalData };
          }
          console.log(`[generate-course-parallel] Successfully invoked 'generate-course-phased' for task ${taskId} (Phase: ${phase})`);
          return { taskId, status: 'fulfilled', value: data, phase, additionalData };
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.error(`[generate-course-parallel] Critical error during invocation for task ${taskId} (Phase: ${phase}):`, message);
          return { taskId, status: 'rejected', reason: `Critical invocation error: ${message}`, phase, additionalData };
        }
      });

      const batchPromiseResults = await Promise.allSettled(batchPromises);
      
      batchPromiseResults.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults.push(result.value); 
        } else {
          console.error('[generate-course-parallel] Unhandled promise rejection in internal batch processing:', result.reason);
          allResults.push({ 
            taskId: 'unknown_task_in_failed_internal_batch', 
            status: 'rejected', 
            reason: result.reason?.message || 'Unknown error in internal batch processing' 
          });
        }
      });
      console.log(`[generate-course-parallel] Finished processing internal batch. ${allResults.length} total results so far for this call.`);
      
      if (i + MAX_CONCURRENT_REQUESTS < tasks.length) {
        console.log(`[generate-course-parallel] Delaying for ${DELAY_BETWEEN_BATCHES_MS}ms before next internal batch.`);
        await delay(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    console.log(`[generate-course-parallel] All ${tasks.length} tasks for this call processed. Returning ${allResults.length} results.`);
    return new Response(JSON.stringify({ results: allResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[generate-course-parallel] Top-level error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

