-- Phase 3: Database Security & Performance Hardening (Fixed)

-- Fix missing indexes for performance optimization (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_micro_modules_course_topic 
ON micro_modules(course_id, topic_index, subtopic_index);

CREATE INDEX IF NOT EXISTS idx_user_micro_progress_user_course 
ON user_micro_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_learning_analytics_session 
ON learning_analytics(user_id, course_id, session_id);

CREATE INDEX IF NOT EXISTS idx_generation_sessions_user_status 
ON generation_sessions(user_id, status, last_activity);

-- Add data integrity constraints
ALTER TABLE micro_modules 
ADD CONSTRAINT IF NOT EXISTS valid_topic_indexes 
CHECK (topic_index >= 0 AND subtopic_index >= 0 AND module_index >= 0);

ALTER TABLE user_micro_progress 
ADD CONSTRAINT IF NOT EXISTS valid_quiz_score 
CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 100));

ALTER TABLE user_micro_progress 
ADD CONSTRAINT IF NOT EXISTS valid_mastery_level 
CHECK (mastery_level IS NULL OR (mastery_level >= 1 AND mastery_level <= 5));

-- Create audit log table for tracking data changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only system can insert audit logs, admins can view
CREATE POLICY IF NOT EXISTS "System can insert audit logs" ON audit_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can view audit logs" ON audit_logs
FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to clean up orphaned records
CREATE OR REPLACE FUNCTION cleanup_orphaned_records()
RETURNS INTEGER AS $$
DECLARE
  cleanup_count INTEGER := 0;
BEGIN
  -- Clean up user_micro_progress without corresponding micro_modules
  DELETE FROM user_micro_progress 
  WHERE micro_module_id NOT IN (SELECT id FROM micro_modules);
  
  GET DIAGNOSTICS cleanup_count = ROW_COUNT;
  
  -- Clean up learning_analytics without corresponding courses
  DELETE FROM learning_analytics 
  WHERE course_id NOT IN (SELECT id FROM courses);
  
  -- Clean up chat_history without corresponding courses (where course_id is not null)
  DELETE FROM chat_history 
  WHERE course_id IS NOT NULL AND course_id NOT IN (SELECT id FROM courses);
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;