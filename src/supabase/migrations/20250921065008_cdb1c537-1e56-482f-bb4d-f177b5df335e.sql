-- Phase 3: Database Security & Performance Hardening (Simplified)

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_micro_modules_course_topic 
ON micro_modules(course_id, topic_index, subtopic_index);

CREATE INDEX IF NOT EXISTS idx_user_micro_progress_user_course 
ON user_micro_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_learning_analytics_session 
ON learning_analytics(user_id, course_id, session_id);

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

-- Create policies for audit logs
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs" ON audit_logs
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
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
  
  RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;