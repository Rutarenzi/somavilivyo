-- Create a function to get conversation message stats
CREATE OR REPLACE FUNCTION get_conversation_message_stats(target_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  message_count INTEGER,
  last_message_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.conversation_id,
    COUNT(am.id)::INTEGER as message_count,
    MAX(am.created_at) as last_message_at
  FROM ai_messages am
  INNER JOIN ai_conversations ac ON ac.id = am.conversation_id
  WHERE ac.user_id = target_user_id
  GROUP BY am.conversation_id;
END;
$$;