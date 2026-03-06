-- Fix security warnings from the linter

-- 1. Add RLS policies for the materialized view
ALTER TABLE course_overview_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own course overview" 
ON course_overview_summary 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Make the materialized view not accessible via the API by moving it to a restricted schema
-- First create a private schema for internal views
CREATE SCHEMA IF NOT EXISTS private;

-- Drop the public materialized view
DROP MATERIALIZED VIEW IF EXISTS public.course_overview_summary CASCADE;

-- Create it in the private schema instead
CREATE MATERIALIZED VIEW private.course_overview_summary AS
SELECT 
  c.id as course_id,
  c.user_id,
  c.title,
  c.description,
  c.skill_area,
  c.difficulty_level,
  c.estimated_duration,
  c.status,
  c.created_at,
  COUNT(mm.id) as total_modules,
  COUNT(CASE WHEN ump.completed_at IS NOT NULL THEN 1 END) as completed_modules,
  COALESCE(AVG(ump.quiz_score), 0) as avg_quiz_score,
  MAX(ump.completed_at) as last_completed_at
FROM public.courses c
LEFT JOIN public.micro_modules mm ON c.id = mm.course_id
LEFT JOIN public.user_micro_progress ump ON c.id = ump.course_id AND mm.id = ump.micro_module_id
GROUP BY c.id, c.user_id, c.title, c.description, c.skill_area, c.difficulty_level, c.estimated_duration, c.status, c.created_at;

-- Create index on the private materialized view
CREATE INDEX IF NOT EXISTS idx_course_overview_summary_user 
ON private.course_overview_summary(user_id, created_at DESC);

-- Update the refresh function to work with the private schema
CREATE OR REPLACE FUNCTION public.refresh_course_overview_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.course_overview_summary;
END;
$$;