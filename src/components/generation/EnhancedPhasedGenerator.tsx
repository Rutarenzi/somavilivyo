import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useBackgroundGeneration } from '@/hooks/useBackgroundGeneration';
import { usePhasedGenerationManager } from "@/hooks/usePhasedGenerationManager";
import { Brain, CheckCircle, Clock, Zap, BookOpen, Target, ArrowRight, Eye, XCircle, Layers, FileText, Award, Play, Loader2, Settings } from "lucide-react";

interface EnhancedPhasedGeneratorProps {
  formData: any;
  onCourseCreated: (course: any) => void;
  backgroundSession?: any;
}

export function EnhancedPhasedGenerator({ formData, onCourseCreated, backgroundSession }: EnhancedPhasedGeneratorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    generateCourse,
    cancelGeneration,
    resetGeneration,
    state,
    loading
  } = usePhasedGenerationManager();
  const { startBackgroundGeneration } = useBackgroundGeneration();

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState(false);

  // Enhanced state management for background processing
  useEffect(() => {
    if (backgroundSession) {
      // Hydrate state from background session
      console.log('🔄 Hydrating from background session:', backgroundSession);
      // Update local state to match background session
    } else if (!loading && !state.isActive && !state.generatedCourse && !state.error && !backgroundMode) {
      console.log('🚀 Starting enhanced course generation with formData:', formData);
      generateCourse(formData);
    }
  }, [backgroundSession, backgroundMode]);

  const handleStartBackgroundGeneration = async () => {
    if (state.sessionId) {
      try {
        setBackgroundMode(true);
        await startBackgroundGeneration(state.sessionId);
        
        // Navigate away while keeping generation running
        navigate('/courses');
      } catch (error) {
        console.error('Failed to start background generation:', error);
        setBackgroundMode(false);
      }
    }
  };

  const handleViewCourse = () => {
    if (state.generatedCourse) {
      onCourseCreated(state.generatedCourse);
    }
  };

  const handleStartOver = () => {
    resetGeneration();
    navigate('/create-course');
  };

  const handleCancelGeneration = () => {
    cancelGeneration();
  };

  const calculatePhaseProgress = () => {
    const phases = ['topics', 'subtopics', 'modules', 'content', 'finalize'];
    const currentPhaseIndex = phases.findIndex(phase => 
      state.currentPhase.toLowerCase().includes(phase)
    );
    
    if (currentPhaseIndex === -1) return state.progress;
    
    const baseProgress = (currentPhaseIndex / phases.length) * 100;
    return Math.max(baseProgress, state.progress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Enhanced Header with Background Mode Toggle */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold">
            <Brain className="h-5 w-5 animate-pulse" />
            EduPerfect Enhanced Course Generator
            {backgroundMode && <Badge variant="secondary" className="ml-2">Background Mode</Badge>}
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            {state.generatedCourse ? 'Complete Course Generated Successfully!' : 
             backgroundMode ? 'Background Generation Active' :
             'Enhanced Sequential Course Generation'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {state.generatedCourse 
              ? 'Your complete personalized course with high-quality content and knowledge checks is ready!'
              : backgroundMode
                ? 'Your course is being generated in the background. You can safely navigate away and return later.'
                : 'Creating your course with robust background processing and persistent progress tracking'
            }
          </p>
        </div>

        {/* Enhanced Control Panel */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{formData.skill || 'Learning Course'}</h3>
                  <p className="text-sm text-gray-600">Enhanced Generation Mode</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  Progress: {Math.round(calculatePhaseProgress())}%
                </Badge>
                <p className="text-sm text-gray-600">
                  {state.currentPhase || 'Initializing'}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Enhanced Progress Display */}
            {state.isActive && !backgroundMode && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(calculatePhaseProgress())}%</span>
                </div>
                <Progress value={calculatePhaseProgress()} className="h-3" />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4 animate-pulse text-blue-500" />
                  {state.currentPhase}
                </div>
                
                {/* Enhanced Control Options */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleStartBackgroundGeneration}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Continue in Background
                  </Button>
                  <Button
                    onClick={handleCancelGeneration}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Generation
                  </Button>
                </div>
              </div>
            )}

            {/* Background Mode Display */}
            {backgroundMode && (
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Settings className="h-5 w-5" />
                    <span className="font-semibold">Background Generation Active</span>
                  </div>
                  <p className="text-blue-700 text-sm mb-3">
                    Your course is being generated in the background. You can safely navigate to other pages 
                    and return later to check progress.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => navigate('/courses')}
                      className="flex-1"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Courses
                    </Button>
                    <Button 
                      onClick={() => setBackgroundMode(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Monitor Progress
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {state.error && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Generation Failed</span>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{state.error}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => generateCourse(formData)}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={handleStartOver}
                    variant="outline"
                    className="flex-1"
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {/* Success State */}
            {state.generatedCourse && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Complete Course Generated Successfully!</span>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">{state.generatedCourse.title}</h4>
                  <p className="text-green-700 text-sm mb-3">{state.generatedCourse.description}</p>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleViewCourse}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Course
                    </Button>
                    <Button 
                      onClick={handleStartOver}
                      variant="outline"
                      className="flex-1"
                    >
                      Create Another
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
