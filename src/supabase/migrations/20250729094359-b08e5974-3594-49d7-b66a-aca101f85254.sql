-- First, let's check the micro_modules structure and fix any NULL subtopic_id values
UPDATE micro_modules 
SET subtopic_id = COALESCE(subtopic_id, 'default-subtopic-' || topic_index::text || '-' || subtopic_index::text)
WHERE subtopic_id IS NULL;

-- Fix the duplicate_template_course function to handle subtopic_id properly
CREATE OR REPLACE FUNCTION public.duplicate_template_course(template_id uuid, target_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  
  -- Duplicate all micro_modules with proper subtopic_id handling
  FOR module_record IN 
    SELECT * FROM micro_modules WHERE course_id = template_id ORDER BY topic_index, subtopic_index, module_index
  LOOP
    INSERT INTO micro_modules (
      course_id, title, content, learning_objective, topic_index, 
      subtopic_index, module_index, estimated_duration_minutes, quick_quiz, subtopic_id
    ) VALUES (
      new_course_id,
      module_record.title,
      module_record.content,
      module_record.learning_objective,
      module_record.topic_index,
      module_record.subtopic_index,
      module_record.module_index,
      module_record.estimated_duration_minutes,
      module_record.quick_quiz,
      COALESCE(module_record.subtopic_id, 'default-subtopic-' || module_record.topic_index::text || '-' || module_record.subtopic_index::text)
    );
  END LOOP;
  
  RETURN new_course_id;
END;
$function$;

-- Now assign all missing template courses to all users
DO $block$
DECLARE
  user_record RECORD;
  assigned_count INTEGER;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT id, email FROM profiles
  LOOP
    BEGIN
      SELECT assign_template_courses_to_user(user_record.id) INTO assigned_count;
      RAISE LOG 'Assigned % new template courses to user % (%)', assigned_count, user_record.id, user_record.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to assign template courses to user % (%): %', user_record.id, user_record.email, SQLERRM;
    END;
  END LOOP;
END;
$block$;