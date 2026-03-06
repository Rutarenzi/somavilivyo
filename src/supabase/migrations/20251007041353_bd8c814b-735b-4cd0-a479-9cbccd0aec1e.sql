-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_token_limit INTEGER NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, description, monthly_token_limit, price_monthly, features) VALUES
  ('free', 'Free Plan', 50000, 0, '["Basic course generation", "Limited AI interactions", "5 courses per month"]'::jsonb),
  ('basic', 'Basic Plan', 200000, 9.99, '["Unlimited courses", "Priority support", "Advanced features"]'::jsonb),
  ('pro', 'Pro Plan', 1000000, 29.99, '["Unlimited everything", "Premium support", "Early access to features", "Custom integrations"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create user token usage tracking table
CREATE TABLE IF NOT EXISTS public.user_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  usage_month TEXT NOT NULL, -- Format: YYYY-MM
  operation_type TEXT NOT NULL, -- 'course_generation', 'ui_generation', 'chat', etc.
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  session_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_token_usage_user_month ON public.user_token_usage(user_id, usage_month);
CREATE INDEX IF NOT EXISTS idx_user_token_usage_created ON public.user_token_usage(created_at);

-- Add subscription plan to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES public.subscription_plans(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Set default free plan for existing users
UPDATE public.profiles 
SET subscription_plan_id = (SELECT id FROM public.subscription_plans WHERE name = 'free' LIMIT 1)
WHERE subscription_plan_id IS NULL;

-- Create view for monthly token usage summary
CREATE OR REPLACE VIEW public.user_monthly_token_summary AS
SELECT 
  user_id,
  usage_month,
  SUM(tokens_used) as total_tokens_used,
  COUNT(*) as total_operations,
  jsonb_object_agg(operation_type, operation_count) as operations_breakdown
FROM (
  SELECT 
    user_id,
    usage_month,
    operation_type,
    SUM(tokens_used) as tokens_used,
    COUNT(*) as operation_count
  FROM public.user_token_usage
  GROUP BY user_id, usage_month, operation_type
) subquery
GROUP BY user_id, usage_month;

-- Function to get current month token usage
CREATE OR REPLACE FUNCTION public.get_user_token_usage(target_user_id UUID)
RETURNS TABLE (
  current_month_usage INTEGER,
  monthly_limit INTEGER,
  percentage_used NUMERIC,
  plan_name TEXT,
  tokens_remaining INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(utu.tokens_used), 0)::INTEGER as current_month_usage,
    sp.monthly_token_limit,
    CASE 
      WHEN sp.monthly_token_limit > 0 THEN 
        ROUND((COALESCE(SUM(utu.tokens_used), 0)::NUMERIC / sp.monthly_token_limit::NUMERIC) * 100, 2)
      ELSE 0
    END as percentage_used,
    sp.name as plan_name,
    GREATEST(sp.monthly_token_limit - COALESCE(SUM(utu.tokens_used), 0), 0)::INTEGER as tokens_remaining
  FROM public.profiles p
  LEFT JOIN public.subscription_plans sp ON p.subscription_plan_id = sp.id
  LEFT JOIN public.user_token_usage utu ON utu.user_id = p.id AND utu.usage_month = current_month
  WHERE p.id = target_user_id
  GROUP BY sp.monthly_token_limit, sp.name;
END;
$$;

-- Function to log token usage
CREATE OR REPLACE FUNCTION public.log_token_usage(
  target_user_id UUID,
  tokens INTEGER,
  operation TEXT,
  target_course_id UUID DEFAULT NULL,
  target_session_id UUID DEFAULT NULL,
  extra_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  INSERT INTO public.user_token_usage (
    user_id,
    tokens_used,
    usage_month,
    operation_type,
    course_id,
    session_id,
    metadata
  ) VALUES (
    target_user_id,
    tokens,
    current_month,
    operation,
    target_course_id,
    target_session_id,
    extra_metadata
  );
  
  RETURN TRUE;
END;
$$;

-- Function to check if user has enough tokens
CREATE OR REPLACE FUNCTION public.check_token_limit(
  target_user_id UUID,
  required_tokens INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
  current_usage INTEGER;
  token_limit INTEGER;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Get current usage and limit
  SELECT 
    COALESCE(SUM(utu.tokens_used), 0),
    sp.monthly_token_limit
  INTO current_usage, token_limit
  FROM public.profiles p
  LEFT JOIN public.subscription_plans sp ON p.subscription_plan_id = sp.id
  LEFT JOIN public.user_token_usage utu ON utu.user_id = p.id AND utu.usage_month = current_month
  WHERE p.id = target_user_id
  GROUP BY sp.monthly_token_limit;
  
  -- Check if user has enough tokens remaining
  RETURN (current_usage + required_tokens) <= token_limit;
END;
$$;

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_token_usage
CREATE POLICY "Users can view their own token usage"
  ON public.user_token_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert token usage"
  ON public.user_token_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update token usage"
  ON public.user_token_usage
  FOR UPDATE
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT ON public.user_token_usage TO authenticated;
GRANT SELECT ON public.user_monthly_token_summary TO authenticated;