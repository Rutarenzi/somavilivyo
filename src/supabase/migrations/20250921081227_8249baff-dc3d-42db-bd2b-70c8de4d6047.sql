-- Enable RLS on AI tables and create proper policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.ai_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.ai_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.ai_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
ON public.ai_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for ai_messages
CREATE POLICY "Users can view messages from their conversations" 
ON public.ai_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.ai_conversations 
  WHERE ai_conversations.id = ai_messages.conversation_id 
  AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their conversations" 
ON public.ai_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ai_conversations 
  WHERE ai_conversations.id = ai_messages.conversation_id 
  AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can update messages in their conversations" 
ON public.ai_messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.ai_conversations 
  WHERE ai_conversations.id = ai_messages.conversation_id 
  AND ai_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages from their conversations" 
ON public.ai_messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.ai_conversations 
  WHERE ai_conversations.id = ai_messages.conversation_id 
  AND ai_conversations.user_id = auth.uid()
));