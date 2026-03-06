-- Complete cleanup of unused tables and materialized views from SomaVilivyo database
-- This script removes all tables, policies, functions, and views identified as unused

-- =============================================================================
-- STEP 1: Drop RLS Policies for unused tables
-- =============================================================================

-- Drop meeting-related policies
DROP POLICY IF EXISTS "Users can view meetings they host" ON public.meetings;
DROP POLICY IF EXISTS "Hosts can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Hosts can update their meetings" ON public.meetings;
DROP POLICY IF EXISTS "Meeting hosts can delete their meetings" ON public.meetings;
DROP POLICY IF EXISTS "Meeting hosts can update their meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON public.meetings;

DROP POLICY IF EXISTS "Users can view participants for meetings they host or attend" ON public.meeting_participants;
DROP POLICY IF EXISTS "Meeting hosts can add participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Users can join meetings as participants" ON public.meeting_participants;
DROP POLICY IF EXISTS "Meeting hosts can update participants" ON public.meeting_participants;

DROP POLICY IF EXISTS "Meeting participants can create live notes" ON public.live_notes;
DROP POLICY IF EXISTS "Users can create notes in meetings they participate in" ON public.live_notes;
DROP POLICY IF EXISTS "Users can view live notes from their meetings" ON public.live_notes;
DROP POLICY IF EXISTS "Users can view notes from meetings they participate in" ON public.live_notes;

-- Drop school-related policies
DROP POLICY IF EXISTS "System admins can manage schools" ON public.schools;
DROP POLICY IF EXISTS "School members can view their school" ON public.schools;
DROP POLICY IF EXISTS "Users can view schools they belong to" ON public.schools;

DROP POLICY IF EXISTS "Admins can view all school registrations" ON public.school_registrations;
DROP POLICY IF EXISTS "Users can create school registrations" ON public.school_registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.school_registrations;

DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their schools" ON public.user_roles;

-- Drop other unused table policies
DROP POLICY IF EXISTS "Users can view their transcripts" ON public.transcripts;
DROP POLICY IF EXISTS "System can manage transcripts" ON public.transcripts;

DROP POLICY IF EXISTS "Users can view polls in their meetings" ON public.polls;
DROP POLICY IF EXISTS "Meeting hosts can create polls" ON public.polls;

DROP POLICY IF EXISTS "Users can vote in polls" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can view votes in accessible polls" ON public.poll_votes;

DROP POLICY IF EXISTS "System can manage predictions" ON public.performance_predictions;
DROP POLICY IF EXISTS "Users can view their predictions" ON public.performance_predictions;

DROP POLICY IF EXISTS "System can manage personalization rules" ON public.personalization_rules;
DROP POLICY IF EXISTS "Users affected by rules can view them" ON public.personalization_rules;

-- =============================================================================
-- STEP 2: Drop Functions that reference unused tables
-- =============================================================================

-- Drop meeting-related functions
DROP FUNCTION IF EXISTS public.generate_video_room_url(uuid);
DROP FUNCTION IF EXISTS public.set_meeting_defaults();
DROP FUNCTION IF EXISTS public.user_can_access_meeting(uuid);
DROP FUNCTION IF EXISTS public.user_is_meeting_host(uuid);
DROP FUNCTION IF EXISTS public.user_is_meeting_participant(uuid);
DROP FUNCTION IF EXISTS public.can_user_access_meeting_participants(uuid);

-- Drop school and user role functions
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_role_in_school(uuid, uuid, app_role);
DROP FUNCTION IF EXISTS public.get_user_primary_school(uuid);
DROP FUNCTION IF EXISTS public.process_school_registration(uuid, boolean, text);

-- Drop unused materialized view refresh functions
DROP FUNCTION IF EXISTS public.refresh_course_overview_summary();
DROP FUNCTION IF EXISTS public.refresh_user_course_summary();

-- =============================================================================
-- STEP 3: Drop Materialized Views
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS public.course_overview_summary;
DROP MATERIALIZED VIEW IF EXISTS public.user_course_summary;
DROP MATERIALIZED VIEW IF EXISTS public.course_progress_summary;

-- =============================================================================
-- STEP 4: Drop Tables (in dependency order)
-- =============================================================================

-- Drop child tables first (those with foreign keys)
DROP TABLE IF EXISTS public.live_notes CASCADE;
DROP TABLE IF EXISTS public.meeting_participants CASCADE;
DROP TABLE IF EXISTS public.poll_votes CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;
DROP TABLE IF EXISTS public.transcripts CASCADE;

-- Drop parent tables
DROP TABLE IF EXISTS public.meetings CASCADE;

-- Drop school-related tables
DROP TABLE IF EXISTS public.school_registrations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;

-- Drop other unused tables
DROP TABLE IF EXISTS public.performance_predictions CASCADE;
DROP TABLE IF EXISTS public.personalization_rules CASCADE;

-- =============================================================================
-- STEP 5: Drop Custom Types used by removed tables
-- =============================================================================

-- Drop enums used by removed tables
DROP TYPE IF EXISTS public.meeting_status CASCADE;
DROP TYPE IF EXISTS public.participant_role CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- =============================================================================
-- STEP 6: Drop any remaining triggers on removed tables
-- =============================================================================

-- Meeting-related triggers
DROP TRIGGER IF EXISTS set_meeting_defaults_trigger ON public.meetings;
DROP TRIGGER IF EXISTS update_meeting_updated_at ON public.meetings;

-- School registration triggers  
DROP TRIGGER IF EXISTS update_school_registration_updated_at ON public.school_registrations;

-- Note: Most triggers will be automatically dropped with CASCADE, but explicit drops ensure cleanup

-- =============================================================================
-- Cleanup complete - All unused tables, views, policies, and functions removed
-- =============================================================================