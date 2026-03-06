-- Create a function to periodically cleanup empty conversations
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete conversations that have no messages and are older than 2 minutes
  DELETE FROM public.ai_conversations 
  WHERE 
    message_count = 0 
    AND created_at < now() - INTERVAL '2 minutes';
    
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;