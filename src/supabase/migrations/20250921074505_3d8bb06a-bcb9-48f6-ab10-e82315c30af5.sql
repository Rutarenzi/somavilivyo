-- Phase 1: Critical Database Performance & Data Integrity Fixes

-- Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_courses_user_id_status ON courses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_courses_category_difficulty ON courses(category, difficulty_level);
CREATE INDEX IF NOT EXISTS idx_micro_modules_course_topic ON micro_modules(course_id, topic_index, subtopic_index);
CREATE INDEX IF NOT EXISTS idx_user_micro_progress_user_course ON user_micro_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_micro_progress_completion ON user_micro_progress(user_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_analytics_user_session ON learning_analytics(user_id, session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_course ON chat_history(user_id, course_id, created_at);
CREATE INDEX IF NOT EXISTS idx_generation_sessions_user_status ON generation_sessions(user_id, status, last_activity);

-- Add data validation functions to prevent JSON corruption
CREATE OR REPLACE FUNCTION validate_json_column(json_data jsonb) RETURNS boolean AS $$
BEGIN
  -- Check if JSON is valid and not corrupted
  IF json_data IS NULL OR json_data = 'null'::jsonb THEN
    RETURN true;
  END IF;
  
  -- Try to access the JSON to ensure it's valid
  PERFORM json_data::text;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to prevent corrupted JSON in courses table
ALTER TABLE courses ADD CONSTRAINT valid_topics_json 
CHECK (validate_json_column(topics));

ALTER TABLE courses ADD CONSTRAINT valid_learning_preferences_json 
CHECK (validate_json_column(learning_preferences));

-- Add constraint for micro_modules JSON fields
ALTER TABLE micro_modules ADD CONSTRAINT valid_quick_quiz_json 
CHECK (validate_json_column(quick_quiz));

ALTER TABLE micro_modules ADD CONSTRAINT valid_prerequisites_json 
CHECK (validate_json_column(prerequisites));

-- Function to clean corrupted JSON data
CREATE OR REPLACE FUNCTION clean_corrupted_json() RETURNS integer AS $$
DECLARE
  affected_rows integer := 0;
BEGIN
  -- Clean corrupted topics JSON in courses
  UPDATE courses SET topics = '[]'::jsonb 
  WHERE NOT validate_json_column(topics);
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Clean corrupted learning_preferences JSON
  UPDATE courses SET learning_preferences = '{}'::jsonb 
  WHERE NOT validate_json_column(learning_preferences);
  
  -- Clean corrupted quick_quiz JSON in micro_modules
  UPDATE micro_modules SET quick_quiz = '{}'::jsonb 
  WHERE NOT validate_json_column(quick_quiz);
  
  -- Clean corrupted prerequisites JSON
  UPDATE micro_modules SET prerequisites = '[]'::jsonb 
  WHERE NOT validate_json_column(prerequisites);
  
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- Run the cleanup function
SELECT clean_corrupted_json();