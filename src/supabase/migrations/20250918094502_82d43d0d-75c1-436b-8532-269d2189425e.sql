-- Add PDF support columns to curriculum_content table
ALTER TABLE curriculum_content 
ADD COLUMN IF NOT EXISTS pdf_file_path text,
ADD COLUMN IF NOT EXISTS content_source text DEFAULT 'text';