import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          quiz_data: any;
          created_at: string;
          updated_at: string;
          edited: boolean;
          order_index: number;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          quiz_data?: any;
          created_at?: string;
          updated_at?: string;
          edited?: boolean;
          order_index: number;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          quiz_data?: any;
          created_at?: string;
          updated_at?: string;
          edited?: boolean;
          order_index?: number;
        };
        Relationships: never[];
      };
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
    const messageId = url.pathname.split('/').pop();

    switch (req.method) {
      case 'GET':
        const conversationId = url.searchParams.get('conversation_id');
        if (!conversationId) {
          throw new Error('Conversation ID required');
        }

        console.log('Fetching messages for conversation:', conversationId);
        
        // Verify user owns the conversation
        const { data: conversation } = await supabaseClient
          .from('ai_conversations')
          .select('id')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single();

        if (!conversation) {
          throw new Error('Conversation not found or unauthorized');
        }

        const { data: messages, error } = await supabaseClient
          .from('ai_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('order_index', { ascending: true });

        if (error) throw error;
        console.log('Found messages:', messages?.length || 0);
        return new Response(JSON.stringify(messages), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'POST':
        const { conversation_id, role, content, quiz_data, order_index } = await req.json();

        // Verify user owns the conversation
        const { data: ownedConversation } = await supabaseClient
          .from('ai_conversations')
          .select('id')
          .eq('id', conversation_id)
          .eq('user_id', user.id)
          .single();

        if (!ownedConversation) {
          throw new Error('Conversation not found or unauthorized');
        }

        const { data: newMessage, error: insertError } = await supabaseClient
          .from('ai_messages')
          .insert({
            conversation_id,
            role,
            content,
            quiz_data,
            order_index,
          } as Database['public']['Tables']['ai_messages']['Insert'])
          .select()
          .single();

        if (insertError) throw insertError;
        return new Response(JSON.stringify(newMessage), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'PUT':
        if (!messageId || messageId === 'ai-message-manager') {
          throw new Error('Message ID required for update');
        }

        const updateData = await req.json() as Database['public']['Tables']['ai_messages']['Update'];
        
        // First verify the message belongs to user's conversation
        const { data: messageToUpdate } = await supabaseClient
          .from('ai_messages')
          .select('conversation_id')
          .eq('id', messageId)
          .single();

        if (!messageToUpdate) {
          throw new Error('Message not found');
        }

        const { data: messageConversation } = await supabaseClient
          .from('ai_conversations')
          .select('id')
          .eq('id', messageToUpdate.conversation_id)
          .eq('user_id', user.id)
          .single();

        if (!messageConversation) {
          throw new Error('Unauthorized to update this message');
        }

        const { data: updatedMessage, error: updateError } = await supabaseClient
          .from('ai_messages')
          .update({ ...updateData, edited: true })
          .eq('id', messageId)
          .select()
          .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedMessage), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'DELETE':
        if (!messageId || messageId === 'ai-message-manager') {
          throw new Error('Message ID required for deletion');
        }

        // Verify ownership before deletion
        const { data: messageToDelete } = await supabaseClient
          .from('ai_messages')
          .select('conversation_id')
          .eq('id', messageId)
          .single();

        if (!messageToDelete) {
          throw new Error('Message not found');
        }

        const { data: deleteConversation } = await supabaseClient
          .from('ai_conversations')
          .select('id')
          .eq('id', messageToDelete.conversation_id)
          .eq('user_id', user.id)
          .single();

        if (!deleteConversation) {
          throw new Error('Unauthorized to delete this message');
        }

        const { error: deleteError } = await supabaseClient
          .from('ai_messages')
          .delete()
          .eq('id', messageId);

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
    console.error('Error in ai-message-manager:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});