

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Send Course Invitation Function Started ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Get request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body received:', requestBody);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { courseId, invitedEmail, invitedEmails, message } = requestBody;

    // Support both single email (legacy) and multiple emails (new bulk feature)
    const emailsToProcess = invitedEmails || (invitedEmail ? [invitedEmail] : []);

    if (!courseId || emailsToProcess.length === 0) {
      console.error('Missing required fields:', { courseId, emailsToProcess });
      return new Response(
        JSON.stringify({ error: 'Course ID and at least one email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Limit to 60 emails for safety
    if (emailsToProcess.length > 60) {
      console.error('Too many emails:', emailsToProcess.length);
      return new Response(
        JSON.stringify({ error: 'Cannot send more than 60 invitations at once' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get and validate authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a regular Supabase client with the user's token for authentication
    const userSupabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Get the current user using the user client
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id, user.email);

    // Check if user owns the course using service role client
    console.log('Checking course ownership for course:', courseId);
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, user_id')
      .eq('id', courseId)
      .eq('user_id', user.id)
      .single();

    if (courseError || !course) {
      console.error('Course access error:', courseError);
      return new Response(
        JSON.stringify({ error: 'Course not found or access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Course found:', course.title);

    // Process all emails
    const results: {
      successful: Array<{ email: any; invitation_id: any }>;
      failed: Array<{ email: any; error: string }>;
      successCount: number;
      failureCount: number;
    } = {
      successful: [],
      failed: [],
      successCount: 0,
      failureCount: 0
    };

    for (const email of emailsToProcess) {
      try {
        console.log(`Processing invitation for email: ${email}`);
        
        // Check if invitation already exists for this email
        const { data: existingInvitation, error: invitationCheckError } = await supabase
          .from('course_invitations')
          .select('id, status')
          .eq('course_id', courseId)
          .eq('invited_email', email)
          .maybeSingle();

        if (invitationCheckError) {
          console.error(`Error checking existing invitation for ${email}:`, invitationCheckError);
          results.failed.push({ email, error: 'Database error checking existing invitation' });
          results.failureCount++;
          continue;
        }

        if (existingInvitation && existingInvitation.status === 'pending') {
          console.log(`Invitation already exists for ${email}`);
          results.failed.push({ email, error: 'Invitation already sent' });
          results.failureCount++;
          continue;
        }

        // Check if the invited user already exists
        const { data: existingUser, error: userLookupError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', email)
          .maybeSingle();

        if (userLookupError) {
          console.error(`Error looking up user ${email}:`, userLookupError);
        }

        console.log(`Existing user found for ${email}:`, !!existingUser);

        // Create the invitation
        const { data: invitation, error: insertError } = await supabase
          .from('course_invitations')
          .insert({
            course_id: courseId,
            invited_by: user.id,
            invited_email: email,
            invited_user_id: existingUser?.id || null,
            message: message || null,
            status: 'pending'
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error creating invitation for ${email}:`, insertError);
          results.failed.push({ email, error: 'Failed to create invitation' });
          results.failureCount++;
          continue;
        }

        console.log(`Invitation created successfully for ${email}:`, invitation.id);

        // If user exists, create notification immediately
        if (existingUser?.id) {
          console.log(`Creating notification for existing user: ${email}`);
          const { error: notificationError } = await supabase
            .from('user_notifications')
            .insert({
              user_id: existingUser.id,
              type: 'course_invitation',
              title: 'Course Invitation',
              message: `You have been invited to view a course: ${course.title}`,
              data: {
                invitation_id: invitation.id,
                course_id: courseId,
                course_title: course.title,
                invited_by_email: user.email
              }
            });

          if (notificationError) {
            console.error(`Error creating notification for ${email}:`, notificationError);
            // Don't fail the entire request for notification errors
          } else {
            console.log(`Notification created successfully for ${email}`);
          }
        }

        results.successful.push({ email, invitation_id: invitation.id });
        results.successCount++;

      } catch (error) {
        console.error(`Unexpected error processing ${email}:`, error);
        results.failed.push({ email, error: 'Unexpected error' });
        results.failureCount++;
      }
    }

    console.log('=== Bulk Course Invitation Results ===');
    console.log(`Successful: ${results.successCount}, Failed: ${results.failureCount}`);
    console.log('Failed emails:', results.failed);

    // Return success if at least one invitation was sent
    if (results.successCount > 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          successCount: results.successCount,
          failureCount: results.failureCount,
          successful: results.successful,
          failed: results.failed,
          message: results.failureCount > 0 
            ? `${results.successCount} invitations sent successfully, ${results.failureCount} failed.`
            : `All ${results.successCount} invitations sent successfully!`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'All invitations failed to send',
          failed: results.failed
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error in send-course-invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

