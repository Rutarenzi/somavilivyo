
import { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Target,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  Edit3
} from "lucide-react";
import { GamifiedQuiz } from "./GamifiedQuiz";
import { StreamingContentRenderer } from "./StreamingContentRenderer";
import { InlineContentEditor } from "./InlineContentEditor";
import { cn } from "@/lib/utils";
import { getValidQuiz } from '@/utils/quizFallback';

interface Module {
  id: string;
  title: string;
  content: string;
  learning_objective: string;
  quick_quiz?: any;
  estimatedMinutes: number;
}

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface PerformanceOptimizedModuleViewProps {
  module: Module;
  unitTitle: string;
  topicTitle: string;
  subtopicTitle: string;
  courseId: string;
  onNavigate: (state: NavigationState) => void;
  onQuizComplete: (score: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isCompleted: boolean;
  canEdit?: boolean;
}

// Memoized breadcrumb component
const BreadcrumbTrail = memo(({ 
  unitTitle, 
  topicTitle, 
  subtopicTitle, 
  moduleTitle, 
  onNavigate 
}: {
  unitTitle: string;
  topicTitle: string;
  subtopicTitle: string;
  moduleTitle: string;
  onNavigate: (state: NavigationState) => void;
}) => (
  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
    <BookOpen className="h-4 w-4" />
    <span 
      className="hover:text-gray-900 cursor-pointer" 
      onClick={() => onNavigate({ view: 'course' })}
    >
      Course
    </span>
    <span>→</span>
    <span className="hover:text-gray-900 cursor-pointer">{unitTitle}</span>
    <span>→</span>
    <span className="hover:text-gray-900 cursor-pointer">{topicTitle}</span>
    <span>→</span>
    <span className="hover:text-gray-900 cursor-pointer">{subtopicTitle}</span>
    <span>→</span>
    <span className="font-medium text-gray-900">{moduleTitle}</span>
  </div>
));

BreadcrumbTrail.displayName = 'BreadcrumbTrail';

export const PerformanceOptimizedModuleView = memo(function PerformanceOptimizedModuleView({
  module,
  unitTitle,
  topicTitle,
  subtopicTitle,
  courseId,
  onNavigate,
  onQuizComplete,
  onNext,
  onPrevious,
  isCompleted,
  canEdit = true
}: PerformanceOptimizedModuleViewProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [moduleContent, setModuleContent] = useState(module.content);
  const [learningObjective, setLearningObjective] = useState(module.learning_objective);
  
  const startTime = useMemo(() => Date.now(), [module.id]);

  // Optimized timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Optimized scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      setScrollProgress(progress);
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContentUpdate = (updatedContent: string, updatedObjective: string) => {
    setModuleContent(updatedContent);
    setLearningObjective(updatedObjective);
  };

  const effectiveQuiz = getValidQuiz(module.quick_quiz, module.title, module.learning_objective, module.id);

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* Sticky Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <Progress value={scrollProgress} className="h-1" />
      </div>

      <div className="h-full flex flex-col">
        {/* Header with breadcrumbs */}
        <div className="bg-white border-b border-gray-200 p-6 pt-8">
          <BreadcrumbTrail
            unitTitle={unitTitle}
            topicTitle={topicTitle}
            subtopicTitle={subtopicTitle}
            moduleTitle={module.title}
            onNavigate={onNavigate}
          />
          
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{module.title}</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatTime(readingTime)} / {module.estimatedMinutes} min</span>
              </div>
              {canEdit && (
                <Button
                  onClick={() => setEditMode(!editMode)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>{editMode ? 'View Mode' : 'Edit Mode'}</span>
                </Button>
              )}
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8 space-y-8">
            {!showQuiz ? (
              <>
                {/* Content Display */}
                {editMode ? (
                  <InlineContentEditor
                    courseId={courseId}
                    moduleId={module.id}
                    title={module.title}
                    content={moduleContent}
                    learningObjective={learningObjective}
                    onContentUpdate={handleContentUpdate}
                    canEdit={canEdit}
                  />
                ) : (
                  <StreamingContentRenderer
                    content={moduleContent}
                    title={module.title}
                    learningObjective={learningObjective}
                    estimatedMinutes={module.estimatedMinutes}
                    isCompleted={isCompleted}
                  />
                )}

                {/* Real World Application */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-green-800">
                      <Lightbulb className="h-5 w-5" />
                      <span>Real-World Application</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-700 leading-relaxed text-lg">
                      Consider how these concepts apply in your daily work or business decisions. 
                      The frameworks you're learning are used by top companies to make strategic 
                      choices that drive success.
                    </p>
                  </CardContent>
                </Card>

                {/* Knowledge Check CTA */}
                {effectiveQuiz && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-purple-800">
                          <HelpCircle className="h-5 w-5" />
                          <span>Ready for Knowledge Check?</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-purple-700 mb-4">
                        Test your understanding with an interactive quiz that reinforces what you've learned.
                      </p>
                      <Button
                        onClick={() => setShowQuiz(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        Start Knowledge Check
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              (
                <GamifiedQuiz
                  quiz={effectiveQuiz}
                  onComplete={onQuizComplete}
                  onNext={isCompleted ? onNext : undefined}
                />
              )
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex items-center space-x-2 px-6 py-3 border-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous Module</span>
            </Button>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuiz(false);
                  window.scrollTo(0, 0);
                }}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Review Content</span>
              </Button>
            </div>

            <Button
              onClick={onNext}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700"
            >
              <span>Next Module</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
