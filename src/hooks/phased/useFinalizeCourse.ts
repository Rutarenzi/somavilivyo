
import { supabase } from '@/integrations/supabase/client';
import type { FinalizationResult } from './types';

export async function finalizeCourse(
  userId: string,
  course: any,
  courseId: string
): Promise<FinalizationResult> {
  console.log('[finalizeCourse] Starting finalization for course:', courseId);
  
  try {
    // Call the finalize-course edge function
    const { data, error } = await supabase.functions.invoke('finalize-course', {
      body: {
        userId,
        course: {
          ...course,
          id: courseId // Ensure the course has the correct ID
        }
      }
    });

    if (error) {
      console.error('[finalizeCourse] Edge function error:', error);
      return {
        finalizedCourseData: null,
        finalizeEdgeError: error,
        stats: null
      };
    }

    if (!data || !data.success) {
      console.error('[finalizeCourse] Finalization failed:', data);
      return {
        finalizedCourseData: null,
        finalizeEdgeError: new Error(data?.error || 'Finalization failed'),
        stats: data?.stats || null
      };
    }

    console.log('[finalizeCourse] Successfully finalized course:', data.stats);
    return {
      finalizedCourseData: data.course,
      finalizeEdgeError: null,
      stats: data.stats
    };

  } catch (error) {
    console.error('[finalizeCourse] Unexpected error:', error);
    return {
      finalizedCourseData: null,
      finalizeEdgeError: error,
      stats: null
    };
  }
}
