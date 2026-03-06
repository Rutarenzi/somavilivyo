
-- Create learning analytics table for detailed engagement metrics
CREATE TABLE public.learning_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  micro_module_id UUID NOT NULL,
  session_id UUID DEFAULT gen_random_uuid(),
  reading_time_seconds INTEGER DEFAULT 0,
  scroll_progress DECIMAL(5,2) DEFAULT 0,
  interaction_count INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,
  replay_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 0,
  comprehension_indicators JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning insights table for AI-generated recommendations
CREATE TABLE public.learning_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'strength', 'weakness', 'recommendation', 'prediction'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 1, -- 1-5 scale
  action_items JSONB DEFAULT '[]',
  confidence_score DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create competency tracking table for skill mastery
CREATE TABLE public.competency_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  competency_name TEXT NOT NULL,
  current_level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
  mastery_percentage DECIMAL(5,2) DEFAULT 0,
  evidence_points JSONB DEFAULT '[]',
  skill_gaps JSONB DEFAULT '[]',
  improvement_suggestions JSONB DEFAULT '[]',
  last_assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learning patterns table for behavior analysis
CREATE TABLE public.learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'study_time', 'completion_rate', 'difficulty_preference', 'learning_pace'
  pattern_data JSONB NOT NULL,
  confidence_level DECIMAL(5,2) DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_current BOOLEAN DEFAULT true
);

-- Extend user_micro_progress with additional metrics
ALTER TABLE public.user_micro_progress 
ADD COLUMN IF NOT EXISTS difficulty_rating INTEGER,
ADD COLUMN IF NOT EXISTS confusion_points JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS help_requests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS optimal_study_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS learning_velocity DECIMAL(8,2) DEFAULT 0;

-- Create performance predictions table
CREATE TABLE public.performance_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  prediction_type TEXT NOT NULL, -- 'completion_time', 'success_probability', 'difficulty_areas'
  predicted_value JSONB NOT NULL,
  confidence_interval JSONB,
  factors_considered JSONB DEFAULT '[]',
  predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  actual_outcome JSONB,
  accuracy_score DECIMAL(5,2)
);

-- Add RLS policies
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competency_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for learning_analytics
CREATE POLICY "Users can view own analytics" ON public.learning_analytics
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analytics" ON public.learning_analytics
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analytics" ON public.learning_analytics
FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for learning_insights
CREATE POLICY "Users can view own insights" ON public.learning_insights
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own insights" ON public.learning_insights
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for competency_tracking
CREATE POLICY "Users can view own competencies" ON public.competency_tracking
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own competencies" ON public.competency_tracking
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own competencies" ON public.competency_tracking
FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for learning_patterns
CREATE POLICY "Users can view own patterns" ON public.learning_patterns
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own patterns" ON public.learning_patterns
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for performance_predictions
CREATE POLICY "Users can view own predictions" ON public.performance_predictions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own predictions" ON public.performance_predictions
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_learning_analytics_user_course ON public.learning_analytics(user_id, course_id);
CREATE INDEX idx_learning_insights_user_active ON public.learning_insights(user_id, is_active);
CREATE INDEX idx_competency_tracking_user_course ON public.competency_tracking(user_id, course_id);
CREATE INDEX idx_learning_patterns_user_current ON public.learning_patterns(user_id, is_current);
CREATE INDEX idx_performance_predictions_user_course ON public.performance_predictions(user_id, course_id);
