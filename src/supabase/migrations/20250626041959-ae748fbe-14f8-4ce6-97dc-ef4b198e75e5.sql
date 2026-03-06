
-- Add the missing total_phases column to the generation_sessions table
ALTER TABLE public.generation_sessions 
ADD COLUMN total_phases INTEGER NOT NULL DEFAULT 4;

-- Add a comment to document the column
COMMENT ON COLUMN public.generation_sessions.total_phases IS 'Total number of phases in the course generation process';
