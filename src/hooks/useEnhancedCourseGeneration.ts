
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EnhancedFormData {
  skill?: string;
  purpose?: string;
  motivation?: string;
  currentLevel?: string | number;
  dailyTime?: string;
  learningStyle?: string;
  pace?: string;
  problemToSolve?: string;
  currentKnowledge?: string;
  relatedSkills?: string;
  toolsUsed?: string;
  theoryVsPractice?: string;
  daysPerWeek?: string;
  finalProject?: string;
  successDefinition?: string;
  // Enhanced fields
  age?: string;
  educationalBackground?: string;
  courseLength?: string;
  customStructure?: any[];
  [key: string]: any;
}

interface GenerationStats {
  topics: number;
  subtopics: number;
  microModules: number;
  expectedModules: number;
  apiKeysUsed: number;
  generationTime: number;
  professionalTitle: string;
}

const getCourseLengthDescription = (length: string) => {
  switch (length) {
    case 'lesson':
      return 'Quick Lesson: 5 core modules (15-30 minutes)';
    case 'short':
      return 'Short Course: 20 essential modules (1-2 weeks)';
    case 'standard':
      return 'Standard Course: 60 comprehensive modules (3-6 weeks)';
    case 'comprehensive':
      return 'Comprehensive Course: 120+ advanced modules (6-12 weeks)';
    case 'custom':
      return 'Custom Course: Following your specified structure';
    default:
      return 'Custom Course: Tailored module count';
  }
};

export const useEnhancedCourseGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateCourse = async (formData: EnhancedFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a course.",
        variant: "destructive",
      });
      return null;
    }

    // Enhanced validation
    if (!formData.skill || formData.skill.trim() === '') {
      toast({
        title: "Missing Information",
        description: "Please provide the skill you want to learn.",
        variant: "destructive",
      });
      return null;
    }

    if (!formData.age) {
      toast({
        title: "Missing Information",
        description: "Please select your age range.",
        variant: "destructive",
      });
      return null;
    }

    if (!formData.educationalBackground) {
      toast({
        title: "Missing Information",
        description: "Please select your educational background.",
        variant: "destructive",
      });
      return null;
    }

    if (!formData.courseLength) {
      toast({
        title: "Missing Information",
        description: "Please select your preferred course length.",
        variant: "destructive",
      });
      return null;
    }

    // Validate custom structure if provided
    if (formData.courseLength === 'custom' && formData.customStructure) {
      const hasInvalidStructure = formData.customStructure.some((topic: any) => 
        !topic.title || !topic.subtopics || topic.subtopics.length === 0 ||
        topic.subtopics.some((subtopic: any) => !subtopic.title || !subtopic.moduleCount || subtopic.moduleCount < 1)
      );
      
      if (hasInvalidStructure) {
        toast({
          title: "Invalid Custom Structure",
          description: "Please ensure all topics have titles and subtopics with valid module counts.",
          variant: "destructive",
        });
        return null;
      }
    }

    setLoading(true);
    setProgress(0);
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting enhanced course generation with complete structure:', formData);
      
      // Phase 1: Initialize
      setCurrentPhase('Initializing enhanced course generation system...');
      setProgress(10);
      
      // Phase 2: Professional title generation
      setCurrentPhase('Generating professional course title and structure...');
      setProgress(20);
      
      // Phase 3: Complete content generation with custom structure awareness
      const courseLengthDesc = getCourseLengthDescription(formData.courseLength);
      if (formData.courseLength === 'custom' && formData.customStructure) {
        const totalModules = formData.customStructure.reduce((acc: number, topic: any) => 
          acc + topic.subtopics.reduce((subAcc: number, subtopic: any) => subAcc + (subtopic.moduleCount || 0), 0), 0
        );
        setCurrentPhase(`Generating custom course with ${totalModules} modules following your exact structure...`);
      } else {
        setCurrentPhase(`Generating complete ${courseLengthDesc} with modules and content...`);
      }
      setProgress(30);
      
      // Prepare enhanced form data with strict structure requirements
      const enhancedFormData = {
        ...formData,
        customStructureInstructions: formData.customStructure ? 
          `CRITICAL: You MUST follow this exact custom structure specification:
          ${JSON.stringify(formData.customStructure, null, 2)}
          
          STRICT REQUIREMENTS:
          1. Create exactly the topics specified with their exact titles
          2. Create exactly the subtopics specified under each topic with their exact titles
          3. Create exactly the number of modules specified for each subtopic (moduleCount)
          4. Do not add extra topics, subtopics, or modules beyond what's specified
          5. Do not change the titles or structure - follow it precisely
          6. Generate high-quality, detailed content for each module as specified
          
          The user has carefully designed this structure, so adherence is critical.` : null
      };
      
      // Call the enhanced course generation edge function
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          userId: user.id,
          formData: enhancedFormData
        }
      });

      if (error) {
        console.error('Enhanced course generation error:', error);
        toast({
          title: "Course Generation Failed",
          description: error.message || "Failed to generate your personalized course. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      setCurrentPhase('Validating course structure and content...');
      setProgress(60);

      console.log('✅ Enhanced course generation response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Enhanced course generation failed');
      }

      // Validate that we have complete course structure
      if (!data.course || !data.course.topics || data.course.topics.length === 0) {
        throw new Error('Generated course is missing topic structure');
      }

      // Enhanced validation for custom structure adherence
      if (formData.courseLength === 'custom' && formData.customStructure) {
        console.log('🔍 Validating custom structure adherence...');
        
        const expectedTopics = formData.customStructure.length;
        const actualTopics = data.course.topics.length;
        
        if (actualTopics !== expectedTopics) {
          console.warn(`⚠️ Topic count mismatch: expected ${expectedTopics}, got ${actualTopics}`);
        }
        
        // Validate each topic and subtopic structure
        let structureMatch = true;
        formData.customStructure.forEach((expectedTopic: any, topicIndex: number) => {
          const actualTopic = data.course.topics[topicIndex];
          if (!actualTopic || actualTopic.title !== expectedTopic.title) {
            structureMatch = false;
            console.warn(`⚠️ Topic ${topicIndex} title mismatch`);
          }
          
          if (actualTopic && actualTopic.subtopics) {
            expectedTopic.subtopics.forEach((expectedSubtopic: any, subtopicIndex: number) => {
              const actualSubtopic = actualTopic.subtopics[subtopicIndex];
              if (!actualSubtopic || actualSubtopic.title !== expectedSubtopic.title) {
                structureMatch = false;
                console.warn(`⚠️ Subtopic ${topicIndex}.${subtopicIndex} title mismatch`);
              }
              
              if (actualSubtopic && actualSubtopic.micro_modules) {
                const expectedModules = expectedSubtopic.moduleCount;
                const actualModules = actualSubtopic.micro_modules.length;
                if (actualModules !== expectedModules) {
                  console.warn(`⚠️ Module count mismatch for ${expectedSubtopic.title}: expected ${expectedModules}, got ${actualModules}`);
                }
              }
            });
          }
        });
        
        if (structureMatch) {
          console.log('✅ Custom structure validation passed');
        } else {
          console.log('⚠️ Custom structure has some discrepancies but proceeding');
        }
      }

      // Validate that topics have subtopics and modules
      let hasCompleteStructure = true;
      let totalModulesFound = 0;
      
      data.course.topics.forEach((topic: any) => {
        if (!topic.subtopics || topic.subtopics.length === 0) {
          hasCompleteStructure = false;
        } else {
          topic.subtopics.forEach((subtopic: any) => {
            if (!subtopic.micro_modules || subtopic.micro_modules.length === 0) {
              hasCompleteStructure = false;
            } else {
              totalModulesFound += subtopic.micro_modules.length;
            }
          });
        }
      });

      if (!hasCompleteStructure) {
        console.warn('⚠️ Generated course missing complete structure, attempting to finalize...');
      }

      console.log(`📊 Structure validation: Found ${totalModulesFound} modules in course topics`);

      // Phase 4: Course finalization
      setCurrentPhase('Finalizing course with micro-modules...');
      setProgress(80);

      // Call finalize-course function to ensure all modules are created
      const { data: finalizeData, error: finalizeError } = await supabase.functions.invoke('finalize-course', {
        body: {
          userId: user.id,
          course: data.course,
          customStructureRequirements: formData.customStructure ? {
            strictAdherence: true,
            expectedStructure: formData.customStructure
          } : null
        }
      });

      if (finalizeError) {
        console.error('Course finalization error:', finalizeError);
        // Don't fail the whole process, use the original course
        console.log('Proceeding with original course data');
      } else if (finalizeData && finalizeData.success) {
        console.log('✅ Course finalization completed:', finalizeData.stats);
        // Update course data with finalized version
        data.course = finalizeData.course;
        data.stats = { ...data.stats, ...finalizeData.stats };
      }

      // Phase 5: Profile update
      setCurrentPhase('Updating user preferences...');
      setProgress(90);

      // Update user profile with enhanced learning preferences
      const enhancedPreferences = {
        ...formData,
        lastGenerationDate: new Date().toISOString(),
        enhancedFeaturesUsed: true,
        courseLengthPreference: formData.courseLength,
        lastGeneratedCourseId: data.course.id,
        customStructureUsed: formData.courseLength === 'custom'
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          learning_preferences: enhancedPreferences,
          onboarding_completed: true,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail the whole process for profile update errors
      }

      setCurrentPhase('Course generation complete with full structure!');
      setProgress(100);

      const generationTime = (Date.now() - startTime) / 1000;
      const generationStats: GenerationStats = {
        topics: data.stats?.topics || data.course.topics.length,
        subtopics: data.stats?.subtopics || 0,
        microModules: data.stats?.microModules || totalModulesFound,
        expectedModules: data.stats?.expectedModules || 0,
        apiKeysUsed: data.stats?.apiKeysUsed || 1,
        generationTime,
        professionalTitle: data.stats?.professionalTitle || data.course?.title || 'Generated Course'
      };

      setStats(generationStats);

      const structureText = `${generationStats.topics} topics, ${generationStats.subtopics} subtopics, ${generationStats.microModules} modules`;
      const qualityText = data.stats?.contentQualityScore ? ` (${data.stats.contentQualityScore}% content quality)` : '';
      const customText = formData.courseLength === 'custom' ? ' following your custom structure' : '';

      toast({
        title: "🚀 Complete Course Generated!",
        description: `"${generationStats.professionalTitle}" created in ${generationTime.toFixed(1)}s with ${structureText}${qualityText}${customText}`,
      });

      return data.course;
    } catch (error) {
      console.error('Unexpected enhanced generation error:', error);
      toast({
        title: "Enhanced Generation Error",
        description: "An unexpected error occurred during course generation. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resetProgress = () => {
    setProgress(0);
    setCurrentPhase('');
    setStats(null);
  };

  return { 
    generateCourse, 
    loading, 
    progress, 
    currentPhase, 
    stats, 
    resetProgress 
  };
};
