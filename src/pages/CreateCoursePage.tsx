import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import IntakeForm from "@/components/IntakeForm";
import CurriculumLessonGenerator from "@/components/course/CurriculumLessonGenerator";
import { useCourseGeneration } from "@/hooks/useCourseGeneration";
import { usePhasedGenerationManager } from "@/hooks/usePhasedGenerationManager";
import { useOnboarding } from "@/hooks/useOnboarding";
import { CourseGenerationProgressModal } from "@/components/course/CourseGenerationProgressModal";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PageIntro } from "@/components/layout/PageIntro";
import { supabase } from "@/integrations/supabase/client";
const CreateCoursePage = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [showCurriculumGenerator, setShowCurriculumGenerator] = useState(false);
  const [userLearnerType, setUserLearnerType] = useState<'student' | 'passionate' | null>(null);
  const {
    generateCourse,
    loading,
    progress,
    currentPhase
  } = useCourseGeneration();
  const {
    state: phasedState,
    generateCourse: generatePhasedCourse
  } = usePhasedGenerationManager();
  const {
    userProfile,
    refreshOnboarding
  } = useOnboarding();

  // Fetch user profile for personalized experience
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        console.log('👤 User logged in, fetching learner type...');
        const {
          data: profile
        } = await supabase.from('profiles').select('learner_type, onboarding_completed').eq('id', user.id).single();
        if (profile) {
          setUserLearnerType(profile.learner_type as 'student' | 'passionate' || 'passionate');
          console.log('📊 User learner type:', profile.learner_type);
        }
      }
    };
    fetchUserProfile();
  }, [user]); // Removed refreshOnboarding to prevent infinite loop

  // Refresh onboarding data separately when user changes
  useEffect(() => {
    if (user) {
      refreshOnboarding();
    }
  }, [user, refreshOnboarding]);

  // Update learner type when userProfile changes
  useEffect(() => {
    if (userProfile?.learner_type) {
      setUserLearnerType(userProfile.learner_type as 'student' | 'passionate');
    }
  }, [userProfile]);
  const handleCourseGeneration = async (formData: any) => {
    try {
      console.log('📋 Form data received:', formData);
      let course;
      if (formData.phase || phasedState.sessionId) {
        console.log('🔄 Using phased generation...');
        course = await generatePhasedCourse(formData);
      } else {
        console.log('⚡ Using standard generation...');
        course = await generateCourse(formData);
      }
      if (course) {
        console.log('✅ Course generated successfully:', course.id);
        toast.success("Course created successfully!");
        navigate(`/course/${course.id}`);
      }
    } catch (error) {
      console.error('❌ Course generation error:', error);
      toast.error("Failed to create course. Please try again.");
    }
  };
  const handleStartCreation = () => {
    if (userLearnerType === 'student') {
      setShowCurriculumGenerator(true);
    } else {
      setShowIntakeForm(true);
    }
  };
  const handleBackToMain = () => {
    setShowIntakeForm(false);
    setShowCurriculumGenerator(false);
  };
  const handleBackToDashboard = () => {
    navigate('/');
  };
  if (showCurriculumGenerator) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleBackToMain} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Curriculum Lesson Generator</h1>
                <p className="text-muted-foreground">Create lessons aligned with your curriculum</p>
              </div>
            </div>
          </div>

          <CurriculumLessonGenerator onGenerate={handleCourseGeneration} loading={loading || phasedState.isActive} />

          <CourseGenerationProgressModal sessionId={phasedState.sessionId} isOpen={loading || phasedState.isActive} onClose={() => {}} />
        </div>
      </div>;
  }
  if (showIntakeForm) {
    return <IntakeForm onComplete={handleCourseGeneration} onBack={handleBackToMain} loading={loading || phasedState.isActive} />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <PageIntro title="EduPerfect Course Creator ✨">
            <div className="text-center space-y-6">
              <h1 className="text-4xl font-bold text-gray-900">AI Assisted Learning Generator</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {userLearnerType === 'student' ? "Create curriculum-aligned lessons tailored to your education level and learning goals." : "Create personalized courses tailored to your learning goals, pace, and style. Our AI adapts to your unique needs for maximum learning effectiveness."}
              </p>
            </div>
          </PageIntro>

          <div className="text-center space-y-8 mt-12">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Personalized Content</h3>
                <p className="text-sm text-gray-600">
                  AI-generated courses adapted to your learning style and goals
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Interactive Learning</h3>
                <p className="text-sm text-gray-600">
                  Engaging quizzes and activities to reinforce your knowledge
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Progress Tracking</h3>
                <p className="text-sm text-gray-600">
                  Monitor your learning journey with detailed analytics
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Button onClick={handleStartCreation} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                {userLearnerType === 'student' ? 'Generate Curriculum Lesson' : 'Create Your Course'}
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="flex justify-center">
                <Button onClick={handleBackToDashboard} variant="ghost" className="text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CourseGenerationProgressModal sessionId={phasedState.sessionId} isOpen={loading || phasedState.isActive} onClose={() => {}} />
    </div>;
};
export default CreateCoursePage;