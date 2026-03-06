
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    console.log('📨 Cancel request data:', requestData);

    const { sessionId, userId } = requestData;

    if (!sessionId || !userId) {
      console.error('❌ Missing required parameters:', { sessionId: !!sessionId, userId: !!userId });
      return new Response(
        JSON.stringify({ error: 'Session ID and User ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🛑 Cancelling generation session:', sessionId, 'for user:', userId);

    // Update the generation session to cancelled status
    const { data: session, error: sessionError } = await supabase
      .from('generation_sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error updating session:', sessionError);
      throw new Error(`Failed to cancel session: ${sessionError.message}`);
    }

    // Cancel any other active sessions for this user
    const { data: cancelledSessions, error: cancelError } = await supabase
      .from('generation_sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('id', sessionId)
      .select();

    if (cancelError) {
      console.warn('⚠️ Warning: Could not cancel other active sessions:', cancelError);
    }

    console.log('✅ Generation session cancelled successfully:', sessionId);
    console.log('🧹 Additional cancelled sessions:', cancelledSessions?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Generation cancelled successfully',
        sessionId: sessionId,
        additionalCancelledSessions: cancelledSessions?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error cancelling generation:', message);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to cancel generation session',
        details: message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
