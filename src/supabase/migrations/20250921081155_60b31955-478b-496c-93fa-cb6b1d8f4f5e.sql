-- Create trigger to update conversation metadata when messages change
CREATE TRIGGER update_ai_conversation_metadata
  AFTER INSERT OR DELETE ON public.ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_metadata();