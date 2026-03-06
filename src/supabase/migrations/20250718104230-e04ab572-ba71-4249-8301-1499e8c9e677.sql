-- Add unique constraint for user_micro_progress table to support UPSERT operations
ALTER TABLE public.user_micro_progress 
ADD CONSTRAINT user_micro_progress_user_course_module_unique 
UNIQUE (user_id, course_id, micro_module_id);

-- Also add an index for better performance on progress queries
CREATE INDEX IF NOT EXISTS idx_user_micro_progress_lookup 
ON public.user_micro_progress (user_id, course_id, micro_module_id);

-- Update any existing duplicate records by keeping the most recent one
WITH ranked_progress AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, course_id, micro_module_id 
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
         ) as rn
  FROM public.user_micro_progress
)
DELETE FROM public.user_micro_progress 
WHERE id IN (
  SELECT id FROM ranked_progress WHERE rn > 1
);