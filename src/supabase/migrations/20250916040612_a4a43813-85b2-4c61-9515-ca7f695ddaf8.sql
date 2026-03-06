-- Create curriculum management tables for Rwanda CBC

-- Countries table
CREATE TABLE IF NOT EXISTS public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  education_system_type text NOT NULL DEFAULT 'CBC',
  created_at timestamp with time zone DEFAULT now()
);

-- Education levels/classes
CREATE TABLE IF NOT EXISTS public.education_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  level_code text NOT NULL,
  level_name text NOT NULL,
  level_category text NOT NULL,
  age_range text,
  is_compulsory boolean DEFAULT false,
  duration_years integer,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(country_id, level_code)
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES public.countries(id) ON DELETE CASCADE,
  subject_code text NOT NULL,
  subject_name text NOT NULL,
  subject_category text DEFAULT 'core',
  hours_per_week integer DEFAULT 0,
  is_examinable boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(country_id, subject_code)
);

-- Link subjects to education levels (many-to-many)
CREATE TABLE IF NOT EXISTS public.level_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  education_level_id uuid REFERENCES public.education_levels(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_core boolean DEFAULT true,
  hours_per_year integer DEFAULT 0,
  assessment_type text DEFAULT 'both',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(education_level_id, subject_id)
);

-- Units/Modules within subjects
CREATE TABLE IF NOT EXISTS public.curriculum_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_subject_id uuid REFERENCES public.level_subjects(id) ON DELETE CASCADE,
  unit_code text NOT NULL,
  unit_title text NOT NULL,
  unit_description text,
  unit_order integer NOT NULL,
  duration_weeks integer,
  learning_outcomes jsonb DEFAULT '[]',
  assessment_criteria jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now()
);

-- Topics within units
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.curriculum_units(id) ON DELETE CASCADE,
  topic_code text NOT NULL,
  topic_title text NOT NULL,
  topic_description text,
  topic_order integer NOT NULL,
  duration_hours integer,
  difficulty_level text DEFAULT 'basic',
  prerequisites jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now()
);

-- Subtopics/Learning Objectives within topics
CREATE TABLE IF NOT EXISTS public.curriculum_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
  subtopic_code text NOT NULL,
  subtopic_title text NOT NULL,
  subtopic_description text,
  learning_objective text NOT NULL,
  subtopic_order integer NOT NULL,
  bloom_taxonomy_level text DEFAULT 'understand',
  competency_indicators jsonb DEFAULT '[]',
  suggested_activities jsonb DEFAULT '[]',
  assessment_methods jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now()
);

-- Actual curriculum content and materials
CREATE TABLE IF NOT EXISTS public.curriculum_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id uuid REFERENCES public.curriculum_subtopics(id) ON DELETE CASCADE,
  content_type text NOT NULL DEFAULT 'learning_material',
  title text NOT NULL,
  content_text text NOT NULL,
  content_metadata jsonb,
  source_document text,
  page_reference text,
  created_at timestamp with time zone DEFAULT now()
);

-- Cross-curricular relationships
CREATE TABLE IF NOT EXISTS public.curriculum_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_subtopic_id uuid REFERENCES public.curriculum_subtopics(id) ON DELETE CASCADE,
  target_subtopic_id uuid REFERENCES public.curriculum_subtopics(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'prerequisite',
  strength_score numeric DEFAULT 0.5,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users to manage curriculum data)
-- Note: In production, you might want more granular permissions

-- Countries policies
CREATE POLICY "Authenticated users can view countries" ON public.countries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage countries" ON public.countries FOR ALL USING (auth.role() = 'authenticated');

-- Education levels policies
CREATE POLICY "Authenticated users can view education levels" ON public.education_levels FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage education levels" ON public.education_levels FOR ALL USING (auth.role() = 'authenticated');

-- Subjects policies
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage subjects" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');

-- Level subjects policies
CREATE POLICY "Authenticated users can view level subjects" ON public.level_subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage level subjects" ON public.level_subjects FOR ALL USING (auth.role() = 'authenticated');

-- Curriculum units policies
CREATE POLICY "Authenticated users can view curriculum units" ON public.curriculum_units FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage curriculum units" ON public.curriculum_units FOR ALL USING (auth.role() = 'authenticated');

-- Curriculum topics policies
CREATE POLICY "Authenticated users can view curriculum topics" ON public.curriculum_topics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage curriculum topics" ON public.curriculum_topics FOR ALL USING (auth.role() = 'authenticated');

-- Curriculum subtopics policies
CREATE POLICY "Authenticated users can view curriculum subtopics" ON public.curriculum_subtopics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage curriculum subtopics" ON public.curriculum_subtopics FOR ALL USING (auth.role() = 'authenticated');

-- Curriculum content policies
CREATE POLICY "Authenticated users can view curriculum content" ON public.curriculum_content FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage curriculum content" ON public.curriculum_content FOR ALL USING (auth.role() = 'authenticated');

-- Curriculum relationships policies
CREATE POLICY "Authenticated users can view curriculum relationships" ON public.curriculum_relationships FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage curriculum relationships" ON public.curriculum_relationships FOR ALL USING (auth.role() = 'authenticated');

-- Insert default data for Rwanda
INSERT INTO public.countries (name, code, education_system_type) 
VALUES ('Rwanda', 'RW', 'CBC') 
ON CONFLICT (code) DO NOTHING;