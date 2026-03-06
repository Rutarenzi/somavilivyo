-- Enable RLS on all public tables that don't have it (excluding waitlist which doesn't exist)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_micro_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_course_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

-- Create secure policies for courses
CREATE POLICY "Users can view their own courses" ON public.courses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own courses" ON public.courses
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" ON public.courses
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" ON public.courses
FOR DELETE USING (auth.uid() = user_id);

-- Create policies for micro_modules
CREATE POLICY "Users can view modules from their courses" ON public.micro_modules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = micro_modules.course_id 
    AND courses.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert modules to their courses" ON public.micro_modules
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = micro_modules.course_id 
    AND courses.user_id = auth.uid()
  )
);

-- Create policies for user progress
CREATE POLICY "Users can view their own progress" ON public.user_micro_progress
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.user_micro_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_micro_progress
FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for AI conversations
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.ai_conversations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.ai_conversations
FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for AI messages
CREATE POLICY "Users can view messages from their conversations" ON public.ai_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages to their conversations" ON public.ai_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_conversations 
    WHERE ai_conversations.id = ai_messages.conversation_id 
    AND ai_conversations.user_id = auth.uid()
  )
);

-- Create policies for generation sessions
CREATE POLICY "Users can view their own sessions" ON public.generation_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.generation_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.generation_sessions
FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.user_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.user_notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Add database indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id_status ON public.courses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_micro_modules_course_id ON public.micro_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON public.user_micro_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_user_status ON public.generation_sessions(user_id, status);