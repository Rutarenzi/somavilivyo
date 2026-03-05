
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  PlayCircle
} from "lucide-react";
import { MicroModule, useMicroModules } from "@/hooks/useMicroModules";
import { UniversalSidebar } from "./UniversalSidebar";
import { EnhancedContentRenderer } from "./EnhancedContentRenderer";
import { GamifiedQuiz } from "./GamifiedQuiz";
import { extractQuizInfo } from "@/utils/contentParser";
import { getValidQuiz } from '@/utils/quizFallback';

interface MicroModuleViewerEnhancedProps {
  courseId: string;
}

export function MicroModuleViewerEnhanced({ courseId }: MicroModuleViewerEnhancedProps) {
  const {
    microModules,
    currentModule,
    currentModuleIndex,
    completeModule,
    goToNextModule,
    goToPreviousModule,
    jumpToModule,
    getProgressStats,
    loading,
    userProgress
  } = useMicroModules(courseId);

  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showQuiz, setShowQuiz] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const progressStats = getProgressStats();

  // Reset state when module changes
  useEffect(() => {
    setStartTime(Date.now());
    setShowQuiz(false);
    setIsCompleted(false);
  }, [currentModuleIndex]);

  // Transform micro-modules into sidebar structure
  const transformToSidebarData = () => {
    const topicsMap = new Map();
    
    microModules.forEach((module) => {
      const topicKey = `topic-${module.topic_index}`;
      const subtopicKey = `subtopic-${module.topic_index}-${module.subtopic_index}`;
      
      if (!topicsMap.has(topicKey)) {
        topicsMap.set(topicKey, {
          id: topicKey,
          title: `Topic ${module.topic_index + 1}`,
          description: '',
          subtopics: new Map()
        });
      }
      
      const topic = topicsMap.get(topicKey);
      if (!topic.subtopics.has(subtopicKey)) {
        topic.subtopics.set(subtopicKey, {
          id: subtopicKey,
          title: `Section ${module.subtopic_index + 1}`,
          description: '',
          modules: []
        });
      }
      
      const isCompleted = userProgress.some(p => p.micro_module_id === module.id && p.completed_at);
      const subtopic = topic.subtopics.get(subtopicKey);
      
      subtopic.modules.push({
        id: module.id,
        title: module.title,
        completed: isCompleted,
        locked: false, // Implement locking logic if needed
        quiz: extractQuizInfo(module.quick_quiz),
        estimatedMinutes: module.estimated_duration_minutes
      });
    });
    
    return Array.from(topicsMap.values()).map(topic => ({
      ...topic,
      subtopics: Array.from(topic.subtopics.values())
    }));
  };

  const handleModuleSelect = (moduleId: string) => {
    const moduleIndex = microModules.findIndex(m => m.id === moduleId);
    if (moduleIndex >= 0) {
      jumpToModule(moduleIndex);
    }
  };

  const handleQuizComplete = async (score: number) => {
    if (!currentModule) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const success = await completeModule(currentModule.id, score, timeSpent);
    
    if (success) {
      setIsCompleted(true);
    }
  };

  const handleContinue = () => {
    goToNextModule();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <PlayCircle className="h-8 w-8 text-indigo-600" />
          </div>
          <p className="text-gray-600">Loading your enhanced learning experience...</p>
        </div>
      </div>
    );
  }

  if (!currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <PlayCircle className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Course Complete! 🎉</h3>
            <p className="text-gray-600 max-w-sm">
              You've mastered all the micro-modules. Amazing dedication to learning!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sidebarData = transformToSidebarData();

  const effectiveQuiz = currentModule ? getValidQuiz(currentModule.quick_quiz, currentModule.title, currentModule.learning_objective, currentModule.id) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex">
      {/* Enhanced Universal Sidebar */}
      <UniversalSidebar
        topics={sidebarData}
        currentModuleId={currentModule.id}
        onModuleSelect={handleModuleSelect}
        progressPercentage={progressStats.progressPercentage}
        completedCount={progressStats.completedModules}
        totalCount={progressStats.totalModules}
        courseTitle="EduPerfect Course"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Progress Header */}
        <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className="bg-indigo-600 text-white">
                Module {progressStats.currentModuleNumber} of {progressStats.totalModules}
              </Badge>
              <h1 className="text-2xl font-bold text-gray-900">{currentModule.title}</h1>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{progressStats.progressPercentage}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {!showQuiz ? (
              <div className="space-y-8">
                <EnhancedContentRenderer
                  content={currentModule.content}
                  title={currentModule.title}
                  learningObjective={currentModule.learning_objective}
                />

                <div className="flex items-center justify-center pt-8">
                  <Button
                    onClick={() => setShowQuiz(true)}
                    size="lg"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Ready for Knowledge Check?
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              (effectiveQuiz && (
                <GamifiedQuiz
                  quiz={effectiveQuiz}
                  onComplete={handleQuizComplete}
                  onNext={isCompleted ? handleContinue : undefined}
                />
              ))
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousModule}
              disabled={currentModuleIndex === 0}
              className="flex items-center gap-2 px-6 py-3 border-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous Module
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStartTime(Date.now());
                  setShowQuiz(false);
                  setIsCompleted(false);
                }}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>
            </div>

            <Button
              onClick={goToNextModule}
              disabled={currentModuleIndex === microModules.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700"
            >
              Next Module
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
