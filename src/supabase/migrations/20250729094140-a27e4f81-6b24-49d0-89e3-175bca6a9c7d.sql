-- Run the assignment function for all existing users to get all 4 template courses
DO $block$
DECLARE
  user_record RECORD;
  assigned_count INTEGER;
BEGIN
  -- Get all users and assign all template courses to them
  FOR user_record IN 
    SELECT DISTINCT id, email FROM profiles
  LOOP
    BEGIN
      -- First, let's see how many courses they currently have
      RAISE LOG 'Processing user % (%)', user_record.id, user_record.email;
      
      -- Call the assignment function to ensure they get all template courses
      SELECT assign_template_courses_to_user(user_record.id) INTO assigned_count;
      RAISE LOG 'Assigned % additional template courses to user % (%)', assigned_count, user_record.id, user_record.email;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to assign template courses to user % (%): %', user_record.id, user_record.email, SQLERRM;
    END;
  END LOOP;
END;
$block$;