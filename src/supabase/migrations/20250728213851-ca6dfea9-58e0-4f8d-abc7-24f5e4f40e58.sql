-- Phase 1: Database Indexing Optimizations for Performance
-- These indexes will dramatically improve query performance for course-related operations

-- 1. Composite index for courses by user_id and created_at (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_courses_user_created 
ON courses(user_id, created_at DESC);

-- 2. Composite index for courses by user_id and status (for filtering active/completed courses)
CREATE INDEX IF NOT EXISTS idx_courses_user_status 
ON courses(user_id, status);

-- 3. Index for shared course access lookups
CREATE INDEX IF NOT EXISTS idx_shared_course_access_user 
ON shared_course_access(user_id);

CREATE INDEX IF NOT EXISTS idx_shared_course_access_course 
ON shared_course_access(course_id);

-- 4. Composite index for user micro progress queries
CREATE INDEX IF NOT EXISTS idx_user_micro_progress_user_course 
ON user_micro_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_micro_progress_completed 
ON user_micro_progress(user_id, course_id, completed_at) 
WHERE completed_at IS NOT NULL;

-- 5. Index for micro modules by course_id (for counting modules)
CREATE INDEX IF NOT EXISTS idx_micro_modules_course 
ON micro_modules(course_id);

-- 6. Index for learning insights by user and course
CREATE INDEX IF NOT EXISTS idx_learning_insights_user_course_active 
ON learning_insights(user_id, course_id, is_active, priority DESC) 
WHERE is_active = true;

-- 7. Index for competency tracking by user and course
CREATE INDEX IF NOT EXISTS idx_competency_tracking_user_course 
ON competency_tracking(user_id, course_id, mastery_percentage DESC);

-- 8. Partial index for active generation sessions (reduces index size)
CREATE INDEX IF NOT EXISTS idx_generation_sessions_active 
ON generation_sessions(user_id, status, last_activity) 
WHERE status = 'active';

-- 9. Create materialized view for course overview with module counts
CREATE MATERIALIZED VIEW IF NOT EXISTS course_overview_summary AS
SELECT 
  c.id as course_id,
  c.user_id,
  c.title,
  c.description,
  c.skill_area,
  c.difficulty_level,
  c.estimated_duration,
  c.status,
  c.created_at,
  COUNT(mm.id) as total_modules,
  COUNT(CASE WHEN ump.completed_at IS NOT NULL THEN 1 END) as completed_modules,
  COALESCE(AVG(ump.quiz_score), 0) as avg_quiz_score,
  MAX(ump.completed_at) as last_completed_at
FROM courses c
LEFT JOIN micro_modules mm ON c.id = mm.course_id
LEFT JOIN user_micro_progress ump ON c.id = ump.course_id AND mm.id = ump.micro_module_id
GROUP BY c.id, c.user_id, c.title, c.description, c.skill_area, c.difficulty_level, c.estimated_duration, c.status, c.created_at;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_course_overview_summary_user 
ON course_overview_summary(user_id, created_at DESC);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_course_overview_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY course_overview_summary;
END;
$$;