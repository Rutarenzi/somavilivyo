
-- First, let's ensure the generation_sessions table exists with proper structure
CREATE TABLE IF NOT EXISTS public.generation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL DEFAULT (gen_random_uuid())::text,
  status text NOT NULL DEFAULT 'active'::text,
  current_phase integer NOT NULL DEFAULT 0,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  phases_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  course_id uuid NULL,
  api_keys_used integer NULL DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone NULL,
  cancelled_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for generation sessions
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own generation sessions" ON public.generation_sessions;
DROP POLICY IF EXISTS "Users can create their own generation sessions" ON public.generation_sessions;
DROP POLICY IF EXISTS "Users can update their own generation sessions" ON public.generation_sessions;

-- Create new policies
CREATE POLICY "Users can view their own generation sessions" 
  ON public.generation_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation sessions" 
  ON public.generation_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation sessions" 
  ON public.generation_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add trigger to update the updated_at and last_activity fields
CREATE OR REPLACE FUNCTION update_generation_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'active' THEN
    NEW.last_activity = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_generation_session_activity_trigger ON public.generation_sessions;

-- Create trigger
CREATE TRIGGER update_generation_session_activity_trigger
  BEFORE UPDATE ON public.generation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_session_activity();

-- Function to cancel old generation sessions
CREATE OR REPLACE FUNCTION cancel_old_generation_sessions()
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  -- Cancel sessions that have been inactive for more than 2 hours
  UPDATE public.generation_sessions 
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    updated_at = now()
  WHERE 
    status = 'active' 
    AND last_activity < now() - INTERVAL '2 hours';
  
  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  
  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql;
