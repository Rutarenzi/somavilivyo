-- Create database function for optimized course data fetching
CREATE OR REPLACE FUNCTION get_optimized_course_data(
  course_id_param UUID,
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  course_data JSON;
  modules_data JSON;
  progress_data JSON;
  result JSON;
BEGIN
  -- Fetch course data
  SELECT to_json(c) INTO course_data
  FROM (
    SELECT id, title, description, skill_area, difficulty_level, topics, status, category
    FROM courses
    WHERE id = course_id_param
  ) c;
  
  -- Fetch micro modules
  SELECT json_agg(m ORDER BY m.topic_index, m.subtopic_index, m.module_index) INTO modules_data
  FROM (
    SELECT id, title, content, learning_objective, topic_index, subtopic_index, 
           module_index, estimated_duration_minutes, quick_quiz
    FROM micro_modules
    WHERE course_id = course_id_param
  ) m;
  
  -- Fetch user progress
  SELECT json_agg(p) INTO progress_data
  FROM (
    SELECT id, micro_module_id, completed_at, quiz_score, mastery_level
    FROM user_micro_progress
    WHERE user_id = user_id_param AND course_id = course_id_param
  ) p;
  
  -- Calculate progress stats
  WITH progress_stats AS (
    SELECT 
      COALESCE(COUNT(*) FILTER (WHERE completed_at IS NOT NULL), 0)::integer as completed_modules,
      COALESCE(COUNT(*), 0)::integer as total_modules_progress,
      COALESCE(AVG(quiz_score) FILTER (WHERE quiz_score IS NOT NULL), 0)::integer as average_score
    FROM user_micro_progress
    WHERE user_id = user_id_param AND course_id = course_id_param
  ),
  module_stats AS (
    SELECT COUNT(*)::integer as total_modules
    FROM micro_modules
    WHERE course_id = course_id_param
  )
  SELECT json_build_object(
    'course', course_data,
    'microModules', COALESCE(modules_data, '[]'::json),
    'userProgress', COALESCE(progress_data, '[]'::json),
    'progressStats', json_build_object(
      'completedModules', ps.completed_modules,
      'totalModules', ms.total_modules,
      'progressPercentage', 
        CASE 
          WHEN ms.total_modules > 0 
          THEN ROUND((ps.completed_modules::numeric / ms.total_modules::numeric) * 100)::integer
          ELSE 0
        END,
      'averageScore', ps.average_score
    )
  ) INTO result
  FROM progress_stats ps, module_stats ms;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_micro_modules_course_order 
ON micro_modules(course_id, topic_index, subtopic_index, module_index);

CREATE INDEX IF NOT EXISTS idx_user_micro_progress_user_course 
ON user_micro_progress(user_id, course_id, completed_at);

-- Create materialized view for course analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS course_progress_summary AS
SELECT 
  c.id as course_id,
  c.title,
  c.user_id as owner_id,
  COUNT(mm.id) as total_modules,
  COUNT(ump.id) FILTER (WHERE ump.completed_at IS NOT NULL) as completed_modules_count,
  AVG(ump.quiz_score) FILTER (WHERE ump.quiz_score IS NOT NULL) as average_quiz_score,
  COUNT(DISTINCT ump.user_id) as active_learners
FROM courses c
LEFT JOIN micro_modules mm ON c.id = mm.course_id
LEFT JOIN user_micro_progress ump ON mm.id = ump.micro_module_id
GROUP BY c.id, c.title, c.user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_progress_summary_course_id 
ON course_progress_summary(course_id);