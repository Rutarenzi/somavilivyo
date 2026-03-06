-- Create storage bucket for curriculum PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('curriculum-pdfs', 'curriculum-pdfs', false, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for curriculum PDFs
CREATE POLICY "Authenticated users can upload curriculum PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'curriculum-pdfs' AND auth.role() = 'authenticated');