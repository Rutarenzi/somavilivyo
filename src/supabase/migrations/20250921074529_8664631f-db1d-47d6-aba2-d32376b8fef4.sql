-- Fix Critical Security Issues from Linter

-- Fix RLS for tables that don't have it enabled
ALTER TABLE curriculum_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_module_overview ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for curriculum_embeddings
CREATE POLICY "Authenticated users can view curriculum embeddings" 
ON curriculum_embeddings FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "System can manage curriculum embeddings" 
ON curriculum_embeddings FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Add RLS policies for course_module_overview (read-only view)
CREATE POLICY "Users can view course module overview" 
ON course_module_overview FOR SELECT 
USING (user_id = auth.uid());

-- Fix function search paths by setting search_path to public
ALTER FUNCTION validate_json_column(jsonb) SET search_path = public;
ALTER FUNCTION clean_corrupted_json() SET search_path = public;
ALTER FUNCTION cleanup_orphaned_records() SET search_path = public;
ALTER FUNCTION update_generation_session_activity() SET search_path = public;
ALTER FUNCTION cleanup_old_sessions() SET search_path = public;
ALTER FUNCTION update_waitlist_updated_at_column() SET search_path = public;
ALTER FUNCTION cancel_old_generation_sessions() SET search_path = public;
ALTER FUNCTION update_conversation_metadata() SET search_path = public;
ALTER FUNCTION update_ai_updated_at_column() SET search_path = public;
ALTER FUNCTION update_course_quality_summary() SET search_path = public;
ALTER FUNCTION activate_pending_invitations() SET search_path = public;
ALTER FUNCTION get_optimized_course_data(uuid, uuid) SET search_path = public;
ALTER FUNCTION assign_template_courses_to_user(uuid) SET search_path = public;
ALTER FUNCTION duplicate_template_course(uuid, uuid) SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;