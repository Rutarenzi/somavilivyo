import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { userId, formData } = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('🚀 Creating course generation session:', {
      userId,
      skill: formData.skill,
      type: formData.type
    });
    // Check learner type to route appropriately
    let learnerType = 'passionate';
    try {
      const { data: profile } = await supabase.from('profiles').select('learner_type').eq('id', userId).single();
      if (profile) {
        learnerType = profile.learner_type || 'passionate';
      }
    } catch (err) {
      console.warn('Could not fetch learner type, using default');
    }
    console.log(`👤 Learner type: ${learnerType}`);
    // For ALL courses (including curriculum), use background session-based generation
    console.log('💡 Creating background generation session...');
    
    // Mark session type for curriculum courses
    const sessionMetadata = learnerType === 'student' && formData.type === 'curriculum' ? 
      { generation_type: 'curriculum_rag' } : 
      { generation_type: 'standard' };
    const { data: session, error: sessionError } = await supabase.from('generation_sessions').insert({
      user_id: userId,
      form_data: { ...formData, ...sessionMetadata },
      status: 'active',
      current_phase: 0,
      total_phases: 5,
      last_activity: new Date().toISOString(),
      metadata: sessionMetadata
    }).select().single();
    if (sessionError) {
      console.error('❌ Failed to create session:', sessionError);
      throw new Error(`Failed to create generation session: ${sessionError.message}`);
    }
    console.log('✅ Created session:', session.id);
    // Start background generation (don't wait for completion)
    EdgeRuntime.waitUntil((async ()=>{
      try {
        const bgResponse = await supabase.functions.invoke('background-course-generation', {
          body: {
            sessionId: session.id,
            action: 'start'
          }
        });
        if (bgResponse.error) {
          console.error('❌ Background generation error:', bgResponse.error);
          await supabase.from('generation_sessions').update({
            status: 'failed',
            error_message: bgResponse.error.message
          }).eq('id', session.id);
        } else {
          console.log('✅ Background generation started successfully');
        }
      } catch (err) {
        console.error('❌ Failed to start background generation:', err);
      }
    })());
    // Return immediately with session info
    return new Response(JSON.stringify({
      success: true,
      sessionId: session.id,
      status: 'processing',
      message: 'Course generation started in background'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', message);
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
