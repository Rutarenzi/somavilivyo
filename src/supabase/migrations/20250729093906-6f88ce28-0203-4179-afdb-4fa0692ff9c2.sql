-- Fix function permissions by adding SECURITY DEFINER
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
$function$;

-- Fix assign_template_courses_to_user function permissions
CREATE OR REPLACE FUNCTION public.assign_template_courses_to_user(target_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- Also fix handle_new_user function permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$;

-- Assign template courses to existing users who may have missed them
DO $block$
DECLARE
  user_record RECORD;
  assigned_count INTEGER;
BEGIN
  -- Find users who don't have any courses but should have template courses
  FOR user_record IN 
    SELECT DISTINCT p.id, p.email
    FROM profiles p
    LEFT JOIN courses c ON c.user_id = p.id AND c.template_course_id IS NOT NULL
    WHERE c.id IS NULL
  LOOP
    BEGIN
      SELECT assign_template_courses_to_user(user_record.id) INTO assigned_count;
      RAISE LOG 'Assigned % template courses to existing user % (%)', assigned_count, user_record.id, user_record.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to assign template courses to existing user % (%): %', user_record.id, user_record.email, SQLERRM;
    END;
  END LOOP;
END;
$block$;