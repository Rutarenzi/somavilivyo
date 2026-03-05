
import { supabase } from '@/integrations/supabase/client';

export async function callPhaseGeneration(
  userId: string,
  sessionId: string,
  phase: string,
  formData: any,
  additionalData?: any
) {
  console.log(`[callPhaseGeneration] Starting ${phase} generation for session ${sessionId}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-course-phased', {
      body: {
        userId,
        sessionId,
        phase,
        formData,
        ...additionalData
      }
    });

    if (error) {
      console.error(`[callPhaseGeneration] Supabase function error for ${phase}:`, error);
      throw new Error(`Edge function error: ${error.message}`);
    }

    if (!data) {
      console.error(`[callPhaseGeneration] No data returned for ${phase}`);
      throw new Error(`No data returned from ${phase} generation`);
    }

    console.log(`[callPhaseGeneration] Successfully generated ${phase}:`, Object.keys(data));
    return data;
    
  } catch (error) {
    console.error(`[callPhaseGeneration] Error in ${phase} generation:`, error);
    throw error;
  }
}
