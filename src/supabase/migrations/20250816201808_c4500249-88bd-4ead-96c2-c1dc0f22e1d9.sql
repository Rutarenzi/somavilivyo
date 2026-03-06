-- Create waitlist table for collecting early access signups
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  student_type TEXT NOT NULL CHECK (student_type IN ('cbc_student', 'general_student', 'other')),
  institution_name TEXT,
  interests JSONB DEFAULT '[]'::jsonb,
  referral_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can sign up for waitlist" 
ON public.waitlist_signups 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can view all waitlist signups" 
ON public.waitlist_signups 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_waitlist_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_waitlist_signups_updated_at
BEFORE UPDATE ON public.waitlist_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_waitlist_updated_at_column();