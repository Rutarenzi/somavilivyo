
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { usePhasedGenerationManager } from "@/hooks/usePhasedGenerationManager";
import { Brain, CheckCircle, Clock, Zap, BookOpen, Target, ArrowRight, Eye, XCircle, Layers, FileText, Award, Play, Loader2 } from "lucide-react";

interface PhasedCourseGeneratorProps {
  formData: any;
  onCourseCreated: (course: any) => void;
  backgroundSession?: any; // Optional background session to resume from
}

export function PhasedCourseGenerator({ formData, onCourseCreated, backgroundSession }: PhasedCourseGeneratorProps) {
  const navigate = useNavigate();
  const {
    generateCourse,
    cancelGeneration,
    resetGeneration,
    state,
    loading
  } = usePhasedGenerationManager();

  const [showTopics, setShowTopics] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'topics' | 'subtopics' | 'modules' | 'content' | 'finalize' | 'complete'>('topics');

  // Initialize generation on component mount or hydrate from background session
  useEffect(() => {
    if (backgroundSession) {
      // Hydrate state from background session
      console.log('🔄 Hydrating from background session:', backgroundSession);
      // Set up state based on background session data
      // This allows resuming the progress interface seamlessly
    } else if (!loading && !state.isActive && !state.generatedCourse && !state.error) {
      console.log('🚀 Starting initial course generation with formData:', formData);
      generateCourse(formData);
    }
  }, [backgroundSession]);

  // Track phase progression based on available data
  useEffect(() => {
    if (state.phaseData) {
      if (state.generatedCourse) {
        setCurrentPhase('complete');
      } else if (state.phaseData.content && Object.keys(state.phaseData.content).length > 0) {
        setCurrentPhase('finalize');
      } else if (state.phaseData.modules && Object.keys(state.phaseData.modules).length > 0) {
        setCurrentPhase('content');
      } else if (state.phaseData.subtopics && Object.keys(state.phaseData.subtopics).length > 0) {
        setCurrentPhase('modules');
      } else if (state.phaseData.topics && state.phaseData.topics.length > 0) {
        setCurrentPhase('subtopics');
      }
    }
  }, [state.phaseData, state.generatedCourse]);

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

  const generateSubtopics = async () => {
    if (!state.phaseData?.topics) return;
    console.log('🔄 Starting subtopic generation for all topics');
    // This will be handled by the orchestrator
    generateCourse({ ...formData, phase: 'subtopics' });
  };

  const generateModules = async () => {
    if (!state.phaseData?.subtopics) return;
    console.log('🔄 Starting module generation for all subtopics');
    generateCourse({ ...formData, phase: 'modules' });
  };

  const generateContent = async () => {
    if (!state.phaseData?.modules) return;
    console.log('🔄 Starting content generation for all modules');
    generateCourse({ ...formData, phase: 'content' });
  };

  const finalizeCourse = async () => {
    if (!state.phaseData?.content) return;
    console.log('🔄 Starting course finalization');
    generateCourse({ ...formData, phase: 'finalize' });
  };

  const getCourseLengthInfo = (length: string) => {
    switch (length) {
      case 'lesson':
        return { 
          label: 'Quick Lesson', 
          modules: '~5 modules', 
          time: '15-30 min',
          topics: '1-3 topics',
          subtopics: '3-5 subtopics each',
          description: 'Core concepts only'
        };
      case 'short':
        return { 
          label: 'Short Course', 
          modules: '15-25 modules', 
          time: '1-2 weeks',
          topics: '3-5 topics',
          subtopics: '5-7 subtopics each',
          description: 'Quick overview & essentials'
        };
      case 'standard':
        return { 
          label: 'Standard Course', 
          modules: '40-80 modules', 
          time: '3-6 weeks',
          topics: '5-8 topics',
          subtopics: '7-10 subtopics each',
          description: 'Comprehensive learning'
        };
      case 'comprehensive':
        return { 
          label: 'Comprehensive Course', 
          modules: '100+ modules', 
          time: '6-12 weeks',
          topics: '8-12 topics',
          subtopics: '10-15 subtopics each',
          description: 'Deep mastery & expertise'
        };
      default:
        return { 
          label: 'Custom Course', 
          modules: 'Variable', 
          time: 'Flexible',
          topics: 'Variable topics',
          subtopics: 'Variable subtopics',
          description: 'Custom scope'
        };
    }
  };

  const courseInfo = getCourseLengthInfo(formData.courseLength);
  const hasCustomStructure = formData.customStructure && formData.customStructure.length > 0;

  // Calculate phase completion status
  const phases = [
    { 
      name: 'Topics', 
      icon: Layers, 
      completed: !!(state.phaseData?.topics && state.phaseData.topics.length > 0),
      active: currentPhase === 'topics',
      count: state.phaseData?.topics?.length || 0
    },
    { 
      name: 'Subtopics', 
      icon: FileText, 
      completed: !!(state.phaseData?.subtopics && Object.keys(state.phaseData.subtopics).length > 0),
      active: currentPhase === 'subtopics',
      count: state.phaseData?.subtopics ? Object.values(state.phaseData.subtopics).flat().length : 0
    },
    { 
      name: 'Modules', 
      icon: BookOpen, 
      completed: !!(state.phaseData?.modules && Object.keys(state.phaseData.modules).length > 0),
      active: currentPhase === 'modules',
      count: state.phaseData?.modules ? Object.values(state.phaseData.modules).flat().length : 0
    },
    { 
      name: 'Content', 
      icon: Award, 
      completed: !!(state.phaseData?.content && Object.keys(state.phaseData.content).length > 0),
      active: currentPhase === 'content',
      count: state.phaseData?.content ? Object.keys(state.phaseData.content).length : 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold">
            <Brain className="h-5 w-5 animate-pulse" />
            EduPerfect Sequential Course Generator
          </div>
          <h1 className="text-4xl font-bold text-gray-900">
            {state.generatedCourse ? 'Complete Course Generated Successfully!' : 
             hasCustomStructure ? 'Generating Your Custom Learning Journey' : 
             'Sequential Course Generation in Progress'}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {state.generatedCourse 
              ? 'Your complete personalized course with high-quality content and knowledge checks is ready!'
              : 'Creating your course through sequential phases: Topics → Subtopics → Modules → Content → Finalize'
            }
          </p>
        </div>

        {/* Course Info Card */}
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{formData.skill || 'Learning Course'}</h3>
                  <p className="text-sm text-gray-600">
                    {hasCustomStructure ? 'Custom Structure' : courseInfo.label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-1">
                  Phase: {currentPhase}
                </Badge>
                <p className="text-sm text-gray-600">
                  {Math.round(state.progress)}% Complete
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Phase Progress Indicators */}
            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-700">Generation Phases</h4>
              <div className="grid grid-cols-4 gap-3">
                {phases.map((phase, index) => {
                  const Icon = phase.icon;
                  return (
                    <div key={phase.name} className={`text-center p-3 rounded-lg border-2 transition-all ${
                      phase.completed 
                        ? 'border-green-500 bg-green-50' 
                        : phase.active
                          ? 'border-blue-500 bg-blue-50 animate-pulse'
                          : 'border-gray-200 bg-gray-50'
                    }`}>
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${
                        phase.completed 
                          ? 'text-green-600' 
                          : phase.active
                            ? 'text-blue-600'
                            : 'text-gray-400'
                      }`} />
                      <p className="text-xs font-medium">{phase.name}</p>
                      {phase.completed && <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />}
                      {phase.count > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{phase.count} items</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sequential Action Buttons */}
            {!state.generatedCourse && !state.error && (
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-700">Phase Controls</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Generate Subtopics Button */}
                  <Button
                    onClick={generateSubtopics}
                    disabled={!phases[0].completed || phases[1].completed || state.isActive}
                    className="flex-col h-20 bg-blue-600 hover:bg-blue-700"
                  >
                    {state.isActive && currentPhase === 'subtopics' ? (
                      <Loader2 className="h-4 w-4 animate-spin mb-1" />
                    ) : (
                      <FileText className="h-4 w-4 mb-1" />
                    )}
                    <span className="text-xs">Generate All Subtopics</span>
                  </Button>

                  {/* Generate Modules Button */}
                  <Button
                    onClick={generateModules}
                    disabled={!phases[1].completed || phases[2].completed || state.isActive}
                    className="flex-col h-20 bg-green-600 hover:bg-green-700"
                  >
                    {state.isActive && currentPhase === 'modules' ? (
                      <Loader2 className="h-4 w-4 animate-spin mb-1" />
                    ) : (
                      <BookOpen className="h-4 w-4 mb-1" />
                    )}
                    <span className="text-xs">Generate All Modules</span>
                  </Button>

                  {/* Generate Content Button */}
                  <Button
                    onClick={generateContent}
                    disabled={!phases[2].completed || phases[3].completed || state.isActive}
                    className="flex-col h-20 bg-purple-600 hover:bg-purple-700"
                  >
                    {state.isActive && currentPhase === 'content' ? (
                      <Loader2 className="h-4 w-4 animate-spin mb-1" />
                    ) : (
                      <Award className="h-4 w-4 mb-1" />
                    )}
                    <span className="text-xs">Generate All Content</span>
                  </Button>

                  {/* Finalize Course Button */}
                  <Button
                    onClick={finalizeCourse}
                    disabled={!phases[3].completed || !!state.generatedCourse || state.isActive}
                    className="flex-col h-20 bg-orange-600 hover:bg-orange-700"
                  >
                    {state.isActive && currentPhase === 'finalize' ? (
                      <Loader2 className="h-4 w-4 animate-spin mb-1" />
                    ) : (
                      <Target className="h-4 w-4 mb-1" />
                    )}
                    <span className="text-xs">Finalize Course</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Progress Section */}
            {state.isActive && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(state.progress)}%</span>
                </div>
                <Progress value={state.progress} className="h-3" />
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-4 w-4 animate-pulse text-blue-500" />
                  {state.currentPhase}
                </div>
                
                {/* Cancel Button */}
                <div className="flex justify-center pt-4">
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
                  
                  {/* Enhanced Course Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="text-center">
                      <div className="font-bold text-green-900">{state.generatedCourse.topics?.length || 0}</div>
                      <div className="text-xs text-green-600">Topics</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-900">
                        {state.generatedCourse.topics?.reduce((acc: number, topic: any) => 
                          acc + (topic.subtopics?.length || 0), 0) || 0}
                      </div>
                      <div className="text-xs text-green-600">Subtopics</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-900">
                        {state.generatedCourse.topics?.reduce((acc: number, topic: any) => 
                          acc + (topic.subtopics?.reduce((subAcc: number, subtopic: any) => 
                            subAcc + (subtopic.micro_modules?.length || 0), 0) || 0), 0) || 0}
                      </div>
                      <div className="text-xs text-green-600">Modules</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-900">
                        {state.generatedCourse.topics?.reduce((acc: number, topic: any) => 
                          acc + (topic.subtopics?.reduce((subAcc: number, subtopic: any) => 
                            subAcc + (subtopic.micro_modules?.filter((module: any) => module.content).length || 0), 0) || 0), 0) || 0}
                      </div>
                      <div className="text-xs text-green-600">Content</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-900">{state.generatedCourse.difficulty_level || 'Adaptive'}</div>
                      <div className="text-xs text-green-600">Difficulty</div>
                    </div>
                  </div>

                  {/* Toggle Topics Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTopics(!showTopics)}
                    className="w-full mb-3"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showTopics ? 'Hide' : 'Preview'} Complete Course Structure
                  </Button>

                  {/* Topics Preview */}
                  {showTopics && state.generatedCourse.topics && (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {state.generatedCourse.topics.map((topic: any, topicIndex: number) => (
                        <div key={topicIndex} className="bg-white rounded-lg p-3 border border-green-200">
                          <h5 className="font-semibold text-gray-900 mb-1">
                            {topicIndex + 1}. {topic.title}
                          </h5>
                          <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                          
                          {topic.subtopics && topic.subtopics.length > 0 && (
                            <div className="space-y-1">
                              {topic.subtopics.map((subtopic: any, subtopicIndex: number) => (
                                <div key={subtopicIndex} className="text-xs text-gray-500 pl-4">
                                  • {subtopic.title} ({subtopic.micro_modules?.length || 0} modules)
                                  {subtopic.micro_modules?.some((module: any) => module.content) && (
                                    <span className="text-green-600 ml-1">✓ Content Ready</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleViewCourse}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Start Learning Journey
                  </Button>
                  <Button 
                    onClick={handleStartOver}
                    variant="outline"
                    className="flex-1"
                  >
                    Create Another Course
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading Animation */}
        {state.isActive && (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-sm text-gray-500">
              Sequential AI generation in progress: {state.currentPhase}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
