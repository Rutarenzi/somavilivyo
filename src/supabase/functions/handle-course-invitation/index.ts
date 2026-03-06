
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
    console.log('=== Handle Course Invitation Function Started ===');
    
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

    const { invitationId, action } = requestBody;

    if (!invitationId || !action) {
      console.error('Missing required fields:', { invitationId, action });
      return new Response(
        JSON.stringify({ error: 'Invitation ID and action are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      console.error('Invalid action:', action);
      return new Response(
        JSON.stringify({ error: 'Action must be either "accept" or "decline"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the current user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Extracting user from token...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.id, user.email);
    console.log('Handling invitation:', invitationId, 'action:', action);

    // Get the invitation
    console.log('Fetching invitation...');
    const { data: invitation, error: invitationError } = await supabase
      .from('course_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      console.error('Invitation not found:', invitationError);
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Invitation found:', invitation);

    // Check if user can handle this invitation
    const canHandle = invitation.invited_user_id === user.id || 
                     invitation.invited_email === user.email;

    if (!canHandle) {
      console.error('User not authorized to handle invitation');
      return new Response(
        JSON.stringify({ error: 'Not authorized to handle this invitation' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authorized to handle invitation');

    // Map action to correct database status values
    const statusValue = action === 'accept' ? 'accepted' : 'declined';
    
    // Update invitation status
    console.log('Updating invitation status to:', statusValue);
    const { error: updateError } = await supabase
      .from('course_invitations')
      .update({ 
        status: statusValue,
        invited_user_id: user.id // Ensure user_id is set
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update invitation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Invitation status updated successfully');

    // If accepted, create shared access
    if (action === 'accept') {
      console.log('Creating shared course access...');
      const { error: accessError } = await supabase
        .from('shared_course_access')
        .insert({
          course_id: invitation.course_id,
          user_id: user.id,
          granted_by: invitation.invited_by,
          access_level: 'view_only'
        });

      if (accessError) {
        console.error('Error creating shared access:', accessError);
        return new Response(
          JSON.stringify({ error: 'Failed to grant course access' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      console.log('Shared course access created successfully');
    }

    console.log('=== Handle Course Invitation Function Completed Successfully ===');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation ${action}ed successfully` 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in handle-course-invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
