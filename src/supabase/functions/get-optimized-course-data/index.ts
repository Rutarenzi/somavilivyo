import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { course_id_param, user_id_param } = await req.json();

    if (!course_id_param || !user_id_param) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🚀 Fetching optimized course data for course: ${course_id_param}, user: ${user_id_param}`);

    // Single optimized query combining all necessary data
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        skill_area,
        difficulty_level,
        topics,
        status,
        category,
        micro_modules!inner(
          id,
          title,
          content,
          learning_objective,
          topic_index,
          subtopic_index,
          module_index,
          estimated_duration_minutes,
          quick_quiz
        )
      `)
      .eq('id', course_id_param)
      .single();

    if (courseError) {
      console.error('❌ Course query error:', courseError);
      return new Response(
        JSON.stringify({ error: 'Course not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch user progress separately for better performance
    const { data: progressData, error: progressError } = await supabase
      .from('user_micro_progress')
      .select('id, micro_module_id, completed_at, quiz_score, mastery_level')
      .eq('user_id', user_id_param)
      .eq('course_id', course_id_param);

    if (progressError) {
      console.error('❌ Progress query error:', progressError);
    }

    const userProgress = progressData || [];
    const microModules = courseData.micro_modules || [];

    // Calculate progress stats efficiently
    const completedModules = userProgress.filter(p => p.completed_at).length;
    const totalModules = microModules.length;
    const averageScore = userProgress.length > 0 
      ? Math.round(userProgress.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / userProgress.length)
      : 0;

    const optimizedData = {
      course: {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        skill_area: courseData.skill_area,
        difficulty_level: courseData.difficulty_level,
        topics: courseData.topics,
        status: courseData.status,
        category: courseData.category
      },
      microModules: microModules.sort((a, b) => {
        // Sort by topic_index, then subtopic_index, then module_index
        if (a.topic_index !== b.topic_index) return a.topic_index - b.topic_index;
        if (a.subtopic_index !== b.subtopic_index) return a.subtopic_index - b.subtopic_index;
        return a.module_index - b.module_index;
      }),
      userProgress,
      progressStats: {
        completedModules,
        totalModules,
        progressPercentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
        averageScore
      }
    };

    console.log(`✅ Successfully fetched optimized data: ${totalModules} modules, ${completedModules} completed`);

    return new Response(
      JSON.stringify(optimizedData),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});