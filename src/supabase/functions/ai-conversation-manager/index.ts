import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface Database {
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
          message_count: number;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
          message_count?: number;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
          message_count?: number;
          last_message_at?: string;
        };
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`${req.method} ${req.url}`);
    
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const conversationId = url.pathname.split('/').pop();

    switch (req.method) {
      case 'GET':
        if (conversationId && conversationId !== 'ai-conversation-manager') {
          // Get single conversation
          console.log('Fetching single conversation:', conversationId);
          const { data, error } = await supabaseClient
            .from('ai_conversations')
            .select('*')
            .eq('id', conversationId)
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Get all conversations for user
          console.log('Fetching all conversations for user:', user.id);
          const { data, error } = await supabaseClient
            .from('ai_conversations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (error) throw error;
          console.log('Found conversations:', data?.length || 0);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

      case 'POST':
        console.log('Creating new conversation');
        let title = 'New Conversation';
        
        // Only try to parse JSON if there's a body
        const contentLength = req.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 0) {
          try {
            const body = await req.json();
            title = body.title || 'New Conversation';
          } catch (error) {
            console.log('No JSON body, using default title');
          }
        }
        
        const { data: newConversation, error: insertError } = await supabaseClient
          .from('ai_conversations')
          .insert({
            user_id: user.id,
            title: title,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        const conv = (newConversation || {}) as Database['public']['Tables']['ai_conversations']['Row'];
        console.log('Created conversation:', conv.id);
        return new Response(JSON.stringify(conv), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!conversationId || conversationId === 'ai-conversation-manager') {
          throw new Error('Conversation ID required for update');
        }

        console.log('Updating conversation:', conversationId);
        const updateData = await req.json() as Database['public']['Tables']['ai_conversations']['Update'];
        const { data: updatedConversation, error: updateError } = await supabaseClient
          .from('ai_conversations')
          .update(updateData)
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedConversation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        if (!conversationId || conversationId === 'ai-conversation-manager') {
          throw new Error('Conversation ID required for deletion');
        }

        console.log('Deleting conversation:', conversationId);
        const { error: deleteError } = await supabaseClient
          .from('ai_conversations')
          .delete()
          .eq('id', conversationId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response('Method not allowed', { 
          status: 405, 
          headers: corsHeaders 
        });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error in ai-conversation-manager:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});