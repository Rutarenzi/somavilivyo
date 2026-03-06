-- Add metadata column to generation_sessions table
ALTER TABLE public.generation_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;