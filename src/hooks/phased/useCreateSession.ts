
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const createGenerationSession = async (
  user: User,
  formData: any
): Promise<{ sessionId: string; sessionToken: string }> => {
  console.log('[useCreateSession] Creating new generation session for user:', user.id);
  
  try {
    const { data, error } = await supabase
      .from('generation_sessions')
      .insert({
        user_id: user.id,
        form_data: formData,
        current_phase: 0,
        total_phases: 4, // Include total_phases
        phases_data: [],
        status: 'active',
        api_keys_used: 0,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .select('id, session_token')
      .single();

    if (error) {
      console.error('[useCreateSession] Error creating session:', error);
      throw new Error(`Failed to create generation session: ${error.message}`);
    }

    if (!data) {
      throw new Error('No session data returned after creation');
    }

    console.log('[useCreateSession] Session created successfully:', data.id);
    return {
      sessionId: data.id,
      sessionToken: data.session_token
    };
  } catch (error) {
    console.error('[useCreateSession] Failed to create session:', error);
    throw error;
  }
};
