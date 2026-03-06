-- Add learner type column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' 
                   AND column_name = 'learner_type' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.profiles 
        ADD COLUMN learner_type TEXT CHECK (learner_type IN ('student', 'passionate')) DEFAULT 'passionate';
        
        COMMENT ON COLUMN public.profiles.learner_type IS 'Type of learner: student (curriculum-based) or passionate (skill-based)';
    END IF;
END $$;