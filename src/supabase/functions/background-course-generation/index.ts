const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { sessionId, phase, action = 'start' } = await req.json();
    console.log(`🤖 [Background Generation] ${action} - Session: ${sessionId}, Phase: ${phase}`);
    if (action === 'start') {
      // Start background generation process
      return await startBackgroundGeneration(supabase, sessionId);
    } else if (action === 'continue') {
      // Continue generation for specific phase
      return await continueGeneration(supabase, sessionId, phase);
    } else if (action === 'check_status') {
      // Check current status
      return await checkGenerationStatus(supabase, sessionId);
    }
    throw new Error('Invalid action specified');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Background Generation] Error:', message);
    return new Response(JSON.stringify({
      success: false,
      error: message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
async function startBackgroundGeneration(supabase, sessionId) {
  // Get session data
  const { data: session, error: sessionError } = await supabase.from('generation_sessions').select('*').eq('id', sessionId).single();
  if (sessionError || !session) {
    throw new Error('Session not found');
  }
  
  // Check if this is a curriculum RAG generation
  const isCurriculumRAG = session.form_data?.generation_type === 'curriculum_rag' || 
                          session.metadata?.generation_type === 'curriculum_rag';
  
  if (isCurriculumRAG) {
    console.log('🎓 Starting curriculum RAG background generation...');
    
    // Use EdgeRuntime.waitUntil for curriculum RAG processing
    const ragTask = processCurriculumRAG(supabase, sessionId, session.user_id, session.form_data).catch((error) => {
      console.error('❌ Curriculum RAG error:', error);
    });
    
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(ragTask);
      console.log('✅ Curriculum RAG task registered with EdgeRuntime.waitUntil');
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Curriculum RAG generation started in background',
      sessionId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  // Mark session as active for background processing
  const { error: updateError } = await supabase.from('generation_sessions').update({
    status: 'active',
    current_phase: 1,
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }).eq('id', sessionId);
  if (updateError) {
    throw new Error(`Failed to update session status: ${updateError.message}`);
  }
  // Start with the first phase immediately
  const phases = [
    'topics',
    'subtopics',
    'modules'
  ];
  
  // Use EdgeRuntime.waitUntil to ensure background task completes even after response
  const backgroundTask = processAllPhases(supabase, sessionId, session.user_id, session.form_data, phases).catch((error) => {
    console.error('❌ Background processing error:', error);
  });
  
  // Register background task with EdgeRuntime to prevent premature shutdown
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(backgroundTask);
    console.log('✅ Background task registered with EdgeRuntime.waitUntil');
  }
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Background generation started with extended runtime',
    sessionId
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
async function continueGeneration(supabase, sessionId, phase) {
  // Get session data
  const { data: session, error: sessionError } = await supabase.from('generation_sessions').select('*').eq('id', sessionId).single();
  if (sessionError || !session) {
    throw new Error('Session not found');
  }
  // Call the appropriate generation phase
  const { data, error } = await supabase.functions.invoke('generate-course-phased', {
    body: {
      userId: session.user_id,
      sessionId: sessionId,
      phase: phase,
      formData: session.form_data
    }
  });
  if (error) {
    // Update session with error
    await supabase.from('generation_sessions').update({
      status: 'failed',
      error_message: error.message,
      updated_at: new Date().toISOString()
    }).eq('id', sessionId);
    throw new Error(`Phase ${phase} failed: ${error.message}`);
  }
  // Update session with progress
  const progress = calculateProgress(phase, session.current_phase, session.total_phases);
  await supabase.from('generation_sessions').update({
    current_phase: getPhaseNumber(phase),
    phases_data: data,
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: progress >= 100 ? 'completed' : 'active'
  }).eq('id', sessionId);
  return new Response(JSON.stringify({
    success: true,
    data,
    progress,
    phase
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
async function checkGenerationStatus(supabase, sessionId) {
  const { data: session, error } = await supabase.from('generation_sessions').select('*').eq('id', sessionId).single();
  if (error) {
    throw new Error('Session not found');
  }
  const progress = calculateProgress(getCurrentPhase(session.current_phase), session.current_phase, session.total_phases);
  return new Response(JSON.stringify({
    success: true,
    session,
    progress,
    isActive: session.status === 'active',
    isCompleted: session.status === 'completed',
    isFailed: session.status === 'failed'
  }), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}
async function processAllPhases(supabase, sessionId, userId, formData, phases) {
  console.log(`🔄 Starting background processing for ${phases.length} phases`);
  // Store all generated data to pass between phases
  let topicsData = [];
  let allSubtopicsData = {};
  for(let i = 0; i < phases.length; i++){
    const phase = phases[i];
    try {
      console.log(`📝 Processing phase ${i + 1}/${phases.length}: ${phase}`);
      // Get current session data to access previous phase results
      const { data: session } = await supabase.from('generation_sessions').select('phases_data').eq('id', sessionId).single();
      const phasesData = session?.phases_data || [];
      // Prepare request body based on phase
      let requestBody = {
        userId,
        sessionId,
        phase,
        formData
      };
      // For topics phase (single invoke, no parallel needed)
      if (phase === 'topics') {
        const { data, error } = await supabase.functions.invoke('generate-course-phased', {
          body: requestBody
        });
        if (error) {
          console.error(`❌ Phase ${phase} failed:`, error);
          await supabase.from('generation_sessions').update({
            status: 'failed',
            error_message: `Phase ${phase} failed: ${error.message}`,
            updated_at: new Date().toISOString()
          }).eq('id', sessionId);
          throw error;
        }
        console.log(`✅ Phase ${phase} completed successfully`);
        // Update progress
        const progress = phase === 'topics' ? 30 : 50;
        await supabase.from('generation_sessions').update({
          current_phase: i + 1,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', sessionId);
        continue;
      }
      // For subtopics phase, use parallel invocation
      if (phase === 'subtopics' && phasesData.length > 0) {
        const topicsPhase = phasesData.find((p)=>p.phase === 'topics');
        if (topicsPhase?.data?.topics) {
          topicsData = topicsPhase.data.topics;
          // Build tasks for parallel processing
          const subtopicTasks = topicsData.map((topic, topicIndex)=>({
              taskId: `subtopic-task-${topicIndex}`,
              phase: 'subtopics',
              additionalData: {
                topicData: topic
              }
            }));
          console.log(`📝 Generating subtopics in parallel for ${subtopicTasks.length} topics`);
          const { data: parallelData, error: parallelError } = await supabase.functions.invoke('generate-course-parallel', {
            body: {
              userId,
              sessionId,
              tasks: subtopicTasks,
              formData
            }
          });
          if (parallelError) {
            throw new Error(`Failed to generate subtopics in parallel: ${parallelError.message}`);
          }
          // Process parallel results
          parallelData.results.forEach((result)=>{
            if (result.status === 'fulfilled') {
              const topicIndex = parseInt(result.taskId.split('-')[2]); // Extract from taskId
              const topic = topicsData[topicIndex];
              allSubtopicsData[topic.title] = result.value.subtopics || [];
            } else {
              console.error(`Subtopic task failed: ${result.reason}`);
            }
          });
          console.log(`✅ Phase ${phase} completed for all ${topicsData.length} topics`);
          // Update progress
          const progress = calculateProgress(phase, i + 1, phases.length);
          await supabase.from('generation_sessions').update({
            current_phase: i + 1,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: progress >= 100 ? 'completed' : 'active'
          }).eq('id', sessionId);
          continue; // Skip the default invocation below
        }
      }
      // For modules phase, use parallel invocation
      if (phase === 'modules' && Object.keys(allSubtopicsData).length > 0) {
        // Flatten subtopics across all topics
        let taskIndex = 0;
        const moduleTasks = [];
        for (const topicTitle of Object.keys(allSubtopicsData)){
          const subtopics = allSubtopicsData[topicTitle];
          subtopics.forEach((subtopic)=>{
            moduleTasks.push({
              taskId: `module-task-${taskIndex}`,
              phase: 'modules',
              additionalData: {
                subtopicData: subtopic
              }
            });
            taskIndex++;
          });
        }
        console.log(`📝 Generating modules in parallel for ${moduleTasks.length} subtopics with high concurrency`);
        
        // Split into smaller batches for better reliability (max 40 tasks per batch)
        const BATCH_SIZE = 40;
        const allParallelResults = [];
        
        for (let batchStart = 0; batchStart < moduleTasks.length; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, moduleTasks.length);
          const batchTasks = moduleTasks.slice(batchStart, batchEnd);
          
          console.log(`📦 Processing batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(moduleTasks.length / BATCH_SIZE)}: ${batchTasks.length} tasks`);
          
          const { data: batchData, error: batchError } = await supabase.functions.invoke('generate-course-parallel', {
            body: {
              userId,
              sessionId,
              tasks: batchTasks,
              formData
            }
          });
          
          if (batchError) {
            console.error(`❌ Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} failed:`, batchError);
            throw new Error(`Failed to generate modules in batch: ${batchError.message}`);
          }
          
          allParallelResults.push(...(batchData?.results || []));
          console.log(`✅ Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} completed: ${batchData?.results?.length || 0} results`);
        }
        
        const parallelData = { results: allParallelResults };
        
        console.log(`📊 Total parallel results received: ${parallelData.results.length}`);
        
        // Process parallel results and attach to subtopics
        let resultIndex = 0;
        for (const topicTitle of Object.keys(allSubtopicsData)){
          const subtopics = allSubtopicsData[topicTitle];
          for(let subtopicIndex = 0; subtopicIndex < subtopics.length; subtopicIndex++){
            const result = parallelData.results[resultIndex];
            if (result.status === 'fulfilled') {
              subtopics[subtopicIndex].micro_modules = result.value.modules || [];
            } else {
              console.error(`Module task failed: ${result.reason}`);
              subtopics[subtopicIndex].micro_modules = [];
            }
            resultIndex++;
          }
        }
        console.log(`✅ Phase modules completed for all subtopics`);
        console.log(`🔄 Starting immediate finalization...`);
        // IMMEDIATELY finalize the course before Edge Function shuts down
        try {
          // Get the complete session data with all phases
          const { data: finalSession, error: sessionFetchError } = await supabase.from('generation_sessions').select('*').eq('id', sessionId).single();
          if (sessionFetchError || !finalSession) {
            throw new Error(`Failed to fetch session data: ${sessionFetchError?.message}`);
          }
          // Build the complete course object from phases_data
          const phasesData = finalSession.phases_data || [];
          // Support both array-based and object-based storage of phases_data
          let topics = [];
          if (Array.isArray(phasesData)) {
            const topicsPhase = phasesData.find((p)=>p.phase === 'topics');
            topics = topicsPhase?.data?.topics || [];
          } else if (phasesData && phasesData.topics) {
            topics = phasesData.topics;
          }
          if (!topics || topics.length === 0) {
            throw new Error('No topics data found in session');
          }
          // ADD THE AGGREGATION CODE HERE:
          const subtopicsPhases = phasesData.filter((p)=>p.phase === 'subtopics');
          const modulesPhases = phasesData.filter((p)=>p.phase === 'modules');
          let moduleIndex = 0;
          topics.forEach((topic, ti)=>{
            topic.subtopics = subtopicsPhases[ti]?.data.subtopics || [];
            topic.subtopics.forEach((subtopic, si)=>{
              subtopic.micro_modules = modulesPhases[moduleIndex]?.data.modules || [];
              moduleIndex++;
            });
          });
          // Attach subtopics and modules from local data (in case phases_data not fully updated)
          Object.keys(allSubtopicsData).forEach((topicTitle, ti)=>{
            topics[ti].subtopics = allSubtopicsData[topicTitle];
          });
          // Generate a course ID
          const courseId = finalSession.course_id || crypto.randomUUID();
          // Build complete course structure
          const course = {
            id: courseId,
            title: formData.skill || 'Generated Course',
            description: formData.description || `Comprehensive course on ${formData.skill}`,
            skill_area: formData.skill || 'General',
            difficulty_level: formData.difficulty || 'intermediate',
            learning_preferences: formData.learningPreferences || {},
            topics: topics,
            estimated_duration: formData.courseLength === 'quick' ? '4-8 hours' : '8-16 hours'
          };
          console.log(`📦 Built course object with ${course.topics.length} topics, ID: ${courseId}`);
          // Call finalize-course edge function
          const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-course', {
            body: {
              userId: userId,
              course: course
            }
          });
          if (finalizeError) {
            throw new Error(`Finalization failed: ${finalizeError.message}`);
          }
          console.log(`✅ Course finalized successfully`);
          // Update session to completed with course_id
          await supabase.from('generation_sessions').update({
            course_id: courseId,
            status: 'completed',
            current_phase: 5,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }).eq('id', sessionId);
          console.log(`✅ Session marked as completed with course_id: ${courseId}`);
        } catch (error) {
          console.error(`❌ Finalization error:`, error);
          // Update session with error
          await supabase.from('generation_sessions').update({
            status: 'failed',
            error_message: `Finalization failed: ${error instanceof Error ? error.message : String(error)}`,
            updated_at: new Date().toISOString()
          }).eq('id', sessionId);
        }
        // Exit the loop after finalization
        return;
      }
    } catch (error) {
      console.error(`❌ Unexpected error in phase ${phase}:`, error);
      await supabase.from('generation_sessions').update({
        status: 'failed',
        error_message: `Unexpected error in ${phase}: ${error instanceof Error ? error.message : String(error)}`,
        updated_at: new Date().toISOString()
      }).eq('id', sessionId);
      return;
    }
  }
  console.log(`🎉 Background processing completed for session ${sessionId}`);
}
function calculateProgress(currentPhase, phaseNumber, totalPhases) {
  const phaseProgress = {
    topics: 20,
    subtopics: 40,
    modules: 60,
    content: 80,
    finalize: 100
  };
  if (currentPhase in phaseProgress) {
    return phaseProgress[currentPhase];
  }
  return phaseNumber / totalPhases * 100;
}
function getPhaseNumber(phase) {
  const phaseNumbers = {
    topics: 1,
    subtopics: 2,
    modules: 3,
    content: 4,
    finalize: 5
  };
  if (phase in phaseNumbers) {
    return phaseNumbers[phase];
  }
  return 0;
}
function getCurrentPhase(phaseNumber) {
  const phases = [
    'topics',
    'subtopics',
    'modules',
    'content',
    'finalize'
  ];
  return phases[phaseNumber - 1] || 'topics';
}

// Process curriculum RAG generation in background
async function processCurriculumRAG(supabase, sessionId, userId, formData) {
  try {
    console.log(`🎓 Processing curriculum RAG for session: ${sessionId}`);
    
    // Update session status
    await supabase.from('generation_sessions').update({
      status: 'active',
      current_phase: 1,
      last_activity: new Date().toISOString()
    }).eq('id', sessionId);
    
    // Call curriculum RAG generator
    const { data: ragData, error: ragError } = await supabase.functions.invoke('curriculum-rag-generator', {
      body: {
        userId,
        formData
      }
    });
    
    if (ragError) {
      throw new Error(`RAG generation failed: ${ragError.message}`);
    }
    
    if (!ragData.success || !ragData.course) {
      throw new Error('RAG generation did not return valid course data');
    }
    
    console.log(`✅ Curriculum RAG completed, course ID: ${ragData.course.id}`);
    
    // Update session with completed course
    await supabase.from('generation_sessions').update({
      status: 'completed',
      course_id: ragData.course.id,
      current_phase: 5,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', sessionId);
    
    console.log(`✅ Session marked as completed with course_id: ${ragData.course.id}`);
    
  } catch (error) {
    console.error(`❌ Curriculum RAG processing error:`, error);
    await supabase.from('generation_sessions').update({
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error),
      updated_at: new Date().toISOString()
    }).eq('id', sessionId);
  }
}
