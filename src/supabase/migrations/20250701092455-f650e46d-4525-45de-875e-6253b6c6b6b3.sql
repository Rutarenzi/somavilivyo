
-- Enhanced learning analytics table for detailed behavior tracking
CREATE TABLE public.enhanced_learning_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  micro_module_id UUID NOT NULL,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  reading_patterns JSONB DEFAULT '{}',
  interaction_patterns JSONB DEFAULT '{}',
  scroll_behavior JSONB DEFAULT '{}',
  time_spent_sections JSONB DEFAULT '{}',
  help_seeking_events JSONB DEFAULT '[]',
  confidence_ratings JSONB DEFAULT '{}',
  struggle_indicators JSONB DEFAULT '[]',
  optimal_learning_time TIMESTAMP WITH TIME ZONE,
  attention_span_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Learning style profiles for each user
CREATE TABLE public.learning_style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_preferences JSONB DEFAULT '{"visual": 0.33, "auditory": 0.33, "kinesthetic": 0.34}',
  pacing_preference TEXT DEFAULT 'moderate', -- 'slow', 'moderate', 'fast'
  difficulty_preference TEXT DEFAULT 'adaptive', -- 'easy', 'moderate', 'challenging', 'adaptive'
  optimal_session_duration INTEGER DEFAULT 30, -- minutes
  preferred_learning_times JSONB DEFAULT '[]', -- array of hour ranges
  learning_style_scores JSONB DEFAULT '{}',
  detected_patterns JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0.5,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adaptive content adjustments log
CREATE TABLE public.adaptive_content_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  micro_module_id UUID NOT NULL,
  adjustment_type TEXT NOT NULL, -- 'difficulty', 'pace', 'format', 'content'
  original_value JSONB,
  adjusted_value JSONB,
  reason TEXT,
  ai_confidence NUMERIC DEFAULT 0.5,
  user_feedback TEXT, -- 'helpful', 'neutral', 'unhelpful'
  effectiveness_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Personalization rules engine
CREATE TABLE public.personalization_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'difficulty', 'pacing', 'content_format', 'learning_path'
  condition_criteria JSONB NOT NULL,
  action_config JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  effectiveness_score NUMERIC DEFAULT 0.5,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Predictive analytics cache
CREATE TABLE public.learning_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL,
  prediction_type TEXT NOT NULL, -- 'performance', 'completion_time', 'difficulty_rating', 'dropout_risk'
  predicted_value JSONB NOT NULL,
  confidence_score NUMERIC DEFAULT 0.5,
  factors_considered JSONB DEFAULT '[]',
  prediction_horizon TEXT DEFAULT '1_week', -- '1_day', '1_week', '1_month'
  expires_at TIMESTAMP WITH TIME ZONE,
  actual_outcome JSONB,
  accuracy_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.enhanced_learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_style_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adaptive_content_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for enhanced_learning_analytics
CREATE POLICY "Users can manage their own learning analytics" 
  ON public.enhanced_learning_analytics 
  FOR ALL 
  USING (auth.uid() = user_id);

-- RLS policies for learning_style_profiles
CREATE POLICY "Users can manage their own learning style profiles" 
  ON public.learning_style_profiles 
  FOR ALL 
  USING (auth.uid() = user_id);

-- RLS policies for adaptive_content_adjustments
CREATE POLICY "Users can view their own content adjustments" 
  ON public.adaptive_content_adjustments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert content adjustments" 
  ON public.adaptive_content_adjustments 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their adjustment feedback" 
  ON public.adaptive_content_adjustments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for personalization_rules (admin-managed, read-only for users)
CREATE POLICY "Users can view active personalization rules" 
  ON public.personalization_rules 
  FOR SELECT 
  USING (is_active = true);

-- RLS policies for learning_predictions
CREATE POLICY "Users can view their own learning predictions" 
  ON public.learning_predictions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage learning predictions" 
  ON public.learning_predictions 
  FOR ALL 
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_enhanced_analytics_user_course ON public.enhanced_learning_analytics(user_id, course_id);
CREATE INDEX idx_enhanced_analytics_session ON public.enhanced_learning_analytics(session_id);
CREATE INDEX idx_learning_style_user ON public.learning_style_profiles(user_id);
CREATE INDEX idx_content_adjustments_user_course ON public.adaptive_content_adjustments(user_id, course_id);
CREATE INDEX idx_personalization_rules_active ON public.personalization_rules(is_active, rule_type);
CREATE INDEX idx_learning_predictions_user_type ON public.learning_predictions(user_id, prediction_type);
CREATE INDEX idx_learning_predictions_expires ON public.learning_predictions(expires_at);
