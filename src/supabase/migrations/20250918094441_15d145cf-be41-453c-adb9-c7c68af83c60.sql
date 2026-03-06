-- Create storage bucket for curriculum PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('curriculum-pdfs', 'curriculum-pdfs', false, 20971520, ARRAY['application/pdf']);

-- Create RLS policies for curriculum PDFs
CREATE POLICY "Authenticated users can upload curriculum PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'curriculum-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view curriculum PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'curriculum-pdfs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update curriculum PDFs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'curriculum-pdfs' AND auth.role() = 'authenticated');

-- Add PDF file path column to curriculum_content table
ALTER TABLE curriculum_content 
ADD COLUMN pdf_file_path text,
ADD COLUMN content_source text DEFAULT 'text' CHECK (content_source IN ('text', 'pdf'));