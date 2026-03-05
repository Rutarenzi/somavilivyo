
import { supabase } from '@/integrations/supabase/client';
import { callPhaseGeneration } from './useCallPhaseGeneration';
import { callParallelGeneration } from './useCallParallelGeneration';
import type { PhasedGenerationState, ToastOptions } from './types';

export async function orchestratePhasedGeneration(
  user: any,
  formData: any,
  updateState: (updates: Partial<PhasedGenerationState>) => void,
  toast: (options: ToastOptions) => void,
  getAbortSignal: () => AbortSignal
): Promise<any> {
  console.log('[orchestratePhasedGeneration] Starting with formData:', formData);

  const abortSignal = getAbortSignal();
  let sessionId = formData.sessionId;

  // Check if generation was cancelled
  const checkCancellation = () => {
    if (abortSignal.aborted) {
      throw new Error("GENERATION_ABORTED_BY_USER");
    }
  };

  try {
    // Step 1: Create or get existing session
    if (!sessionId) {
      console.log('[orchestratePhasedGeneration] Creating new generation session...');
      const { data: sessionData, error: sessionError } = await supabase
        .from('generation_sessions')
        .insert({
          user_id: user.id,
          form_data: formData,
          status: 'active',
          current_phase: 0,
          total_phases: 4,
          phases_data: [],
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        })
        .select()
        .single();

      if (sessionError) {
        console.error('[orchestratePhasedGeneration] Session creation error:', sessionError);
        throw new Error(`Failed to create generation session: ${sessionError.message}`);
      }

      sessionId = sessionData.id;
      console.log('[orchestratePhasedGeneration] Created session:', sessionId);
    }

    updateState({ sessionId });

    // Determine if we're using custom structure
    const useCustomStructure = formData.customStructure && formData.customStructure.length > 0;
    
    let topics;
    
    if (useCustomStructure) {
      // Use custom structure as topics
      console.log('[orchestratePhasedGeneration] Using custom structure as topics');
      topics = formData.customStructure.map((topic: any, index: number) => ({
        id: `topic-${index}`,
        title: topic.title,
        description: topic.description,
        order: index + 1,
        estimated_duration: calculateTopicDuration(topic.subtopics)
      }));
      
      updateState({
        currentPhase: 'Processing custom course structure...',
        progress: 35,
        phaseData: { topics }
      });
    } else {
      // Step 2: Generate Topics (Phase 1) - only if not using custom structure
      checkCancellation();
      updateState({ 
        currentPhase: 'Generating course topics...', 
        progress: 20 
      });

      console.log('[orchestratePhasedGeneration] Phase 1: Generating topics...');
      
      let topicsData;
      try {
        topicsData = await callPhaseGeneration(
          user.id,
          sessionId,
          'topics',
          formData
        );
        
        console.log('[orchestratePhasedGeneration] Raw topics response:', topicsData);
        
        // Validate the response structure
        if (!topicsData || !topicsData.topics) {
          console.error('[orchestratePhasedGeneration] Invalid topics response structure:', topicsData);
          throw new Error('Invalid response structure from topics generation');
        }
        
      } catch (error) {
        console.error('[orchestratePhasedGeneration] Topics generation error:', error);
        throw new Error(`Failed to generate topics: ${error.message}`);
      }

      topics = topicsData.topics;
      
      if (!topics || !Array.isArray(topics) || topics.length === 0) {
        console.error('[orchestratePhasedGeneration] No valid topics generated:', topics);
        throw new Error('No topics were generated');
      }

      console.log(`[orchestratePhasedGeneration] Generated ${topics.length} topics`);

      updateState({
        phaseData: { topics },
        progress: 35
      });
    }

    // Step 3: Generate Subtopics for all topics (Phase 2)
    checkCancellation();
    updateState({ 
      currentPhase: 'Generating subtopics for all topics...', 
      progress: 40 
    });

    console.log('[orchestratePhasedGeneration] Phase 2: Generating subtopics...');
    
    let subtopicsMap: { [topicIndex: number]: any[] } = {};
    
    if (useCustomStructure) {
      // Use custom subtopics
      formData.customStructure.forEach((topic: any, topicIndex: number) => {
        subtopicsMap[topicIndex] = topic.subtopics.map((subtopic: any, index: number) => ({
          id: `subtopic-${topicIndex}-${index}`,
          title: subtopic.title,
          description: subtopic.description,
          order: index + 1,
          estimated_modules: subtopic.moduleCount
        }));
      });
      console.log(`[orchestratePhasedGeneration] Using custom subtopics for ${Object.keys(subtopicsMap).length} topics`);
    } else {
      // Generate subtopics via API
      const subtopicTasks = topics.map((topic: any, topicIndex: number) => ({
        taskId: `subtopic-${topicIndex}`,
        phase: 'subtopics',
        additionalData: { topicData: topic, topicIndex }
      }));

      const subtopicResults = await callParallelGeneration(
        user.id,
        sessionId,
        subtopicTasks,
        formData
      );

      // Process subtopic results
      for (const result of subtopicResults) {
        if (result.status === 'fulfilled' && result.value?.subtopics) {
          const topicIndex = result.additionalData.topicIndex;
          subtopicsMap[topicIndex] = result.value.subtopics;
        }
      }
      console.log(`[orchestratePhasedGeneration] Generated subtopics for ${Object.keys(subtopicsMap).length} topics`);
    }

    updateState({
      phaseData: { topics, subtopics: subtopicsMap },
      progress: 55
    });

    // Step 4: Generate Modules for all subtopics (Phase 3)
    checkCancellation();
    updateState({ 
      currentPhase: 'Generating modules for all subtopics...', 
      progress: 60 
    });

    console.log('[orchestratePhasedGeneration] Phase 3: Generating modules...');
    const moduleTasks: any[] = [];
    
    topics.forEach((topic: any, topicIndex: number) => {
      const topicSubtopics = subtopicsMap[topicIndex] || [];
      topicSubtopics.forEach((subtopic: any, subtopicIndex: number) => {
        moduleTasks.push({
          taskId: `module-${topicIndex}-${subtopicIndex}`,
          phase: 'modules',
          additionalData: { 
            subtopicData: subtopic, 
            topicIndex, 
            subtopicIndex,
            expectedModuleCount: useCustomStructure ? subtopic.estimated_modules : undefined
          }
        });
      });
    });

    const moduleResults = await callParallelGeneration(
      user.id,
      sessionId,
      moduleTasks,
      formData
    );

    // Process module results
    const modulesMap: { [key: string]: any[] } = {};
    for (const result of moduleResults) {
      if (result.status === 'fulfilled' && result.value?.modules) {
        const { topicIndex, subtopicIndex } = result.additionalData;
        const key = `${topicIndex}-${subtopicIndex}`;
        modulesMap[key] = result.value.modules;
      }
    }

    console.log(`[orchestratePhasedGeneration] Generated modules for ${Object.keys(modulesMap).length} subtopics`);

    updateState({
      phaseData: { topics, subtopics: subtopicsMap, modules: modulesMap },
      progress: 75
    });

    // Step 5: Generate Content for all modules (Phase 4)
    checkCancellation();
    updateState({ 
      currentPhase: 'Generating content for all modules...', 
      progress: 80 
    });

    console.log('[orchestratePhasedGeneration] Phase 4: Generating content...');
    const contentTasks: any[] = [];
    
    topics.forEach((topic: any, topicIndex: number) => {
      const topicSubtopics = subtopicsMap[topicIndex] || [];
      topicSubtopics.forEach((subtopic: any, subtopicIndex: number) => {
        const subtopicModules = modulesMap[`${topicIndex}-${subtopicIndex}`] || [];
        subtopicModules.forEach((module: any, moduleIndex: number) => {
          contentTasks.push({
            taskId: `content-${topicIndex}-${subtopicIndex}-${moduleIndex}`,
            phase: 'content',
            additionalData: { 
              moduleData: module, 
              topicIndex, 
              subtopicIndex, 
              moduleIndex 
            }
          });
        });
      });
    });

    const contentResults = await callParallelGeneration(
      user.id,
      sessionId,
      contentTasks,
      formData
    );

    // Process content results
    const contentMap: { [key: string]: any } = {};
    for (const result of contentResults) {
      if (result.status === 'fulfilled' && result.value?.content) {
        const { topicIndex, subtopicIndex, moduleIndex } = result.additionalData;
        const key = `${topicIndex}-${subtopicIndex}-${moduleIndex}`;
        contentMap[key] = result.value.content;
      }
    }

    console.log(`[orchestratePhasedGeneration] Generated content for ${Object.keys(contentMap).length} modules`);

    updateState({
      phaseData: { topics, subtopics: subtopicsMap, modules: modulesMap, content: contentMap },
      progress: 90
    });

    // Step 6: Finalize and create course
    checkCancellation();
    updateState({ 
      currentPhase: 'Finalizing course structure...', 
      progress: 95 
    });

    console.log('[orchestratePhasedGeneration] Finalizing course...');
    
    // Build complete course structure
    const courseStructure = {
      title: `Complete ${formData.skill} Course`,
      description: `Comprehensive course covering ${formData.skill} fundamentals to advanced concepts`,
      skill_area: formData.skill,
      difficulty_level: 'progressive',
      estimated_duration: getEstimatedDuration(formData.courseLength, useCustomStructure, topics),
      topics: topics.map((topic: any, topicIndex: number) => ({
        ...topic,
        subtopics: (subtopicsMap[topicIndex] || []).map((subtopic: any, subtopicIndex: number) => ({
          ...subtopic,
          micro_modules: (modulesMap[`${topicIndex}-${subtopicIndex}`] || []).map((module: any, moduleIndex: number) => ({
            ...module,
            content: contentMap[`${topicIndex}-${subtopicIndex}-${moduleIndex}`] || {}
          }))
        }))
      })),
      status: 'published'
    };

    // Save to database
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        user_id: user.id,
        ...courseStructure,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (courseError) {
      console.error('[orchestratePhasedGeneration] Course creation error:', courseError);
      throw new Error(`Failed to create course: ${courseError.message}`);
    }

    // Update session as completed
    await supabase
      .from('generation_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        course_id: course.id
      })
      .eq('id', sessionId);

    updateState({
      currentPhase: 'Course generation completed successfully!',
      progress: 100,
      generatedCourse: course,
      isActive: false
    });

    console.log('[orchestratePhasedGeneration] Course generation completed:', course.id);
    
    toast({
      title: "Course Generated Successfully!",
      description: `Your ${formData.skill} course is ready with complete structure and content.`,
      variant: "default"
    });

    return course;

  } catch (error) {
    console.error('[orchestratePhasedGeneration] Error:', error);
    
    if (sessionId) {
      await supabase
        .from('generation_sessions')
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }

    throw error;
  }
}

function calculateTopicDuration(subtopics: any[]): string {
  const totalModules = subtopics.reduce((sum, subtopic) => sum + (subtopic.moduleCount || 3), 0);
  const estimatedMinutes = totalModules * 15; // 15 minutes per module
  return `${Math.ceil(estimatedMinutes / 60)} hours`;
}

function getEstimatedDuration(courseLength: string, useCustomStructure: boolean, topics?: any[]): string {
  if (useCustomStructure && topics) {
    const totalDuration = topics.reduce((sum, topic) => {
      const hours = parseInt(topic.estimated_duration || '1');
      return sum + hours;
    }, 0);
    return `${totalDuration} hours`;
  }
  
  switch (courseLength) {
    case 'lesson': return '30 minutes';
    case 'short': return '2-3 hours';
    case 'standard': return '8-12 hours';
    case 'comprehensive': return '20+ hours';
    case 'custom': return '4-8 hours';
    default: return '8-10 hours';
  }
}
