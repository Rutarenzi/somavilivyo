
-- Create generation_sessions table for tracking active generation processes
CREATE TABLE public.generation_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'paused')),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_phase INTEGER NOT NULL DEFAULT 0,
  phases_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  api_keys_used INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can delete their own generation sessions" 
  ON public.generation_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to auto-cancel old sessions
CREATE OR REPLACE FUNCTION cancel_old_generation_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
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
$$;

-- Add trigger to update last_activity on any change
CREATE OR REPLACE FUNCTION update_generation_session_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'active' THEN
    NEW.last_activity = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_generation_session_activity_trigger
  BEFORE UPDATE ON public.generation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_generation_session_activity();

-- Create index for better performance
CREATE INDEX idx_generation_sessions_user_status ON public.generation_sessions(user_id, status);
CREATE INDEX idx_generation_sessions_last_activity ON public.generation_sessions(last_activity) WHERE status = 'active';
