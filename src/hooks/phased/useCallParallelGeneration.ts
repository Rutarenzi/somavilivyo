
import { supabase } from '@/integrations/supabase/client';

export interface ParallelTask {
  taskId: string;
  phase: string;
  additionalData: any;
}

export interface ParallelResult {
  taskId: string;
  status: 'fulfilled' | 'rejected';
  value?: any;
  reason?: any;
  additionalData: any;
}

export async function callParallelGeneration(
  userId: string,
  sessionId: string,
  tasks: ParallelTask[],
  formData: any
): Promise<ParallelResult[]> {
  console.log(`[callParallelGeneration] Starting ${tasks.length} parallel tasks`);
  
  // Process tasks in batches to avoid overwhelming the system
  const batchSize = 5;
  const results: ParallelResult[] = [];
  
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    console.log(`[callParallelGeneration] Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} tasks`);
    
    const batchPromises = batch.map(async (task) => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-course-phased', {
          body: {
            userId,
            sessionId,
            phase: task.phase,
            formData,
            ...task.additionalData
          }
        });

        if (error) {
          return {
            taskId: task.taskId,
            status: 'rejected' as const,
            reason: error,
            additionalData: task.additionalData
          };
        }

        return {
          taskId: task.taskId,
          status: 'fulfilled' as const,
          value: data,
          additionalData: task.additionalData
        };
      } catch (error) {
        return {
          taskId: task.taskId,
          status: 'rejected' as const,
          reason: error,
          additionalData: task.additionalData
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Convert Promise.allSettled results to our format
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const task = batch[index];
        results.push({
          taskId: task.taskId,
          status: 'rejected',
          reason: result.reason,
          additionalData: task.additionalData
        });
      }
    });
  }
  
  console.log(`[callParallelGeneration] Completed ${results.length} tasks`);
  return results;
}
