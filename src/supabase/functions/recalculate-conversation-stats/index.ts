import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the current user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log(`Recalculating conversation stats for user: ${user.id}`);

    // Get actual message counts and last message times for user's conversations
    const { data: messageStats, error: statsError } = await supabase.rpc('get_conversation_message_stats', {
      target_user_id: user.id
    });

    if (statsError) {
      console.error('Error getting message stats:', statsError);
      // Fallback to direct query if RPC fails
      const { data: fallbackStats, error: fallbackError } = await supabase
        .from('ai_messages')
        .select(`
          conversation_id,
          created_at
        `)
        .in('conversation_id', 
          await supabase
            .from('ai_conversations')
            .select('id')
            .eq('user_id', user.id)
            .then(({ data }) => data?.map(c => c.id) || [])
        );

      if (fallbackError) {
        throw fallbackError;
      }

      // Calculate stats manually
      const statsMap = new Map();
      fallbackStats?.forEach(msg => {
        const convId = msg.conversation_id;
        if (!statsMap.has(convId)) {
          statsMap.set(convId, { count: 0, lastMessageAt: null });
        }
        const stats = statsMap.get(convId);
        stats.count++;
        if (!stats.lastMessageAt || msg.created_at > stats.lastMessageAt) {
          stats.lastMessageAt = msg.created_at;
        }
      });

      // Update conversations with correct stats
      let updatedCount = 0;
      for (const [conversationId, stats] of statsMap) {
        const { error: updateError } = await supabase
          .from('ai_conversations')
          .update({
            message_count: stats.count,
            last_message_at: stats.lastMessageAt
          })
          .eq('id', conversationId)
          .eq('user_id', user.id);

        if (!updateError) {
          updatedCount++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          updatedConversations: updatedCount,
          method: 'fallback'
        }),
        { headers: corsHeaders }
      );
    }

    // Update conversations with correct message counts and last message times
    let updatedCount = 0;
    for (const stat of messageStats) {
      const { error: updateError } = await supabase
        .from('ai_conversations')
        .update({
          message_count: stat.message_count,
          last_message_at: stat.last_message_at
        })
        .eq('id', stat.conversation_id)
        .eq('user_id', user.id);

      if (!updateError) {
        updatedCount++;
      } else {
        console.error(`Failed to update conversation ${stat.conversation_id}:`, updateError);
      }
    }

    console.log(`Updated ${updatedCount} conversations`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedConversations: updatedCount,
        method: 'rpc'
      }),
      { headers: corsHeaders }
    );

  } catch (error: unknown) {
    console.error('Error in recalculate-conversation-stats:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: corsHeaders }
    );
  }
});