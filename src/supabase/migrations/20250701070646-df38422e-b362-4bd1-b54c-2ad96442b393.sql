
-- Add category field to courses table
ALTER TABLE public.courses 
ADD COLUMN category text DEFAULT 'General';

-- Add an index for better performance when filtering by category
CREATE INDEX idx_courses_category ON public.courses(category);

-- Update existing courses to have a default category
UPDATE public.courses 
SET category = 'General' 
WHERE category IS NULL;
