-- Add generated_code column to micro_modules table for dynamic content rendering
ALTER TABLE public.micro_modules 
ADD COLUMN generated_code TEXT;