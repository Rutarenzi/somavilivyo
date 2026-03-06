-- First, let's clean up any duplicate courses
DELETE FROM courses 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, template_course_id ORDER BY created_at) as rn
    FROM courses 
    WHERE template_course_id IS NOT NULL
  ) t WHERE rn > 1
);

-- Now fix the assignment function to prevent duplicates and ensure all templates are assigned
CREATE OR REPLACE FUNCTION public.assign_template_courses_to_user(target_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  template_course RECORD;
  assigned_count INTEGER := 0;
  new_course_id UUID;
  existing_course_id UUID;
BEGIN
  -- Loop through all template courses
  FOR template_course IN 
    SELECT id FROM courses WHERE is_template_course = TRUE AND status = 'published'
  LOOP
    -- Check if user already has this template course
    SELECT id INTO existing_course_id 
    FROM courses 
    WHERE user_id = target_user_id 
      AND template_course_id = template_course.id 
    LIMIT 1;
    
    -- Only create if it doesn't exist
    IF existing_course_id IS NULL THEN
      BEGIN
        -- Duplicate the template course for the user
        SELECT duplicate_template_course(template_course.id, target_user_id) INTO new_course_id;
        assigned_count := assigned_count + 1;
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue with other template courses
        RAISE WARNING 'Failed to assign template course % to user %: %', template_course.id, target_user_id, SQLERRM;
      END;
    END IF;
  END LOOP;
  
  RETURN assigned_count;
END;
$function$;

-- Now assign all template courses to all users
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