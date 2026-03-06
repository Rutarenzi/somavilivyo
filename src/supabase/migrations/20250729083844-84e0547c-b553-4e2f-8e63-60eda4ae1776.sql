-- Add template course system to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_template_course BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS template_course_id UUID REFERENCES courses(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_is_template ON courses(is_template_course) WHERE is_template_course = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_template_ref ON courses(template_course_id) WHERE template_course_id IS NOT NULL;

-- Function to duplicate a template course for a user
CREATE OR REPLACE FUNCTION duplicate_template_course(
  template_id UUID,
  target_user_id UUID
) RETURNS UUID AS $$
DECLARE
  new_course_id UUID;
  template_course RECORD;
  module_record RECORD;
BEGIN
  -- Get the template course
  SELECT * INTO template_course FROM courses WHERE id = template_id AND is_template_course = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template course not found: %', template_id;
  END IF;
  
  -- Duplicate the course
  INSERT INTO courses (
    user_id, title, description, skill_area, difficulty_level, 
    estimated_duration, topics, learning_preferences, status, 
    category, template_course_id, is_template_course
  ) VALUES (
    target_user_id, 
    template_course.title,
    template_course.description,
    template_course.skill_area,
    template_course.difficulty_level,
    template_course.estimated_duration,
    template_course.topics,
    template_course.learning_preferences,
    'published', -- Make user courses published
    template_course.category,
    template_id, -- Reference to original template
    FALSE -- User courses are not templates
  ) RETURNING id INTO new_course_id;
  
  -- Duplicate all micro_modules
  FOR module_record IN 
    SELECT * FROM micro_modules WHERE course_id = template_id ORDER BY topic_index, subtopic_index, module_index
  LOOP
    INSERT INTO micro_modules (
      course_id, title, content, learning_objective, topic_index, 
      subtopic_index, module_index, estimated_duration_minutes, quick_quiz
    ) VALUES (
      new_course_id,
      module_record.title,
      module_record.content,
      module_record.learning_objective,
      module_record.topic_index,
      module_record.subtopic_index,
      module_record.module_index,
      module_record.estimated_duration_minutes,
      module_record.quick_quiz
    );
  END LOOP;
  
  RETURN new_course_id;
END;
$$ LANGUAGE plpgsql;

-- Function to assign all template courses to a new user
CREATE OR REPLACE FUNCTION assign_template_courses_to_user(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  template_course RECORD;
  assigned_count INTEGER := 0;
  new_course_id UUID;
BEGIN
  -- Loop through all template courses
  FOR template_course IN 
    SELECT id FROM courses WHERE is_template_course = TRUE AND status = 'published'
  LOOP
    BEGIN
      -- Duplicate the template course for the user
      SELECT duplicate_template_course(template_course.id, target_user_id) INTO new_course_id;
      assigned_count := assigned_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other template courses
      RAISE WARNING 'Failed to assign template course % to user %: %', template_course.id, target_user_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to include template course assignment
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assigned_courses INTEGER;
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign template courses to new user
  BEGIN
    SELECT assign_template_courses_to_user(NEW.id) INTO assigned_courses;
    RAISE LOG 'Assigned % template courses to new user %', assigned_courses, NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to assign template courses to user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Mark the specified courses as template courses
UPDATE courses 
SET is_template_course = TRUE, status = 'published'
WHERE id IN (
  '253b67a7-928e-4826-9b4d-eea09a3f2091',
  '5721598f-f3a3-4324-ae53-7c514e8e5f46', 
  '8831a871-99a8-4750-80ca-d7aceba914ab',
  'efbd97f8-29a6-4cce-b005-e585184be36e'
);