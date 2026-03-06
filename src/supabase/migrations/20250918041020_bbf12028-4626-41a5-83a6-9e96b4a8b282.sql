-- Add learner type and educational background to profiles
ALTER TABLE public.profiles 
ADD COLUMN learner_type TEXT CHECK (learner_type IN ('student', 'passionate')) DEFAULT 'passionate',
ADD COLUMN country_id UUID REFERENCES public.countries(id),
ADD COLUMN education_level_id UUID REFERENCES public.education_levels(id),
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN learning_preferences JSONB DEFAULT '{}';

-- Add helpful comment
COMMENT ON COLUMN public.profiles.learner_type IS 'Type of learner: student (curriculum-based) or passionate (skill-based)';
COMMENT ON COLUMN public.profiles.learning_preferences IS 'Stores user learning preferences and personalization data';