
import { useState, useEffect } from "react";
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
  RotateCcw
} from "lucide-react";
import { GamifiedQuiz } from "./GamifiedQuiz";
import { EnhancedDynamicContentRenderer } from "./EnhancedDynamicContentRenderer";
import { cn } from "@/lib/utils";
import { getValidQuiz } from '@/utils/quizFallback';
import { ModuleAudioPlayer } from "./ModuleAudioPlayer";

interface Module {
  id: string;
  title: string;
  content: string;
  learning_objective: string;
  quick_quiz?: any;
  estimatedMinutes: number;
  generated_code?: string;
}

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface ModuleViewProps {
  module: Module;
  unitTitle: string;
  topicTitle: string;
  subtopicTitle: string;
  courseStylePreferences?: any;
  onNavigate: (state: NavigationState) => void;
  onQuizComplete: (score: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isCompleted: boolean;
}

export function ModuleView({
  module,
  unitTitle,
  topicTitle,
  subtopicTitle,
  courseStylePreferences,
  onNavigate,
  onQuizComplete,
  onNext,
  onPrevious,
  isCompleted
}: ModuleViewProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Reset quiz completed state when module changes
  useEffect(() => {
    setQuizCompleted(false);
    setShowQuiz(false);
  }, [module.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effectiveQuiz = getValidQuiz(module.quick_quiz, module.title, module.learning_objective, module.id);

  return (
    <div className="h-full bg-gray-50 overflow-hidden">
      {/* Sticky Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <Progress value={scrollProgress} className="h-1" />
      </div>

      <div className="h-full flex flex-col">
      {/* Header with breadcrumbs - Mobile Responsive */}
      <div className="bg-white border-b border-gray-200 p-3 xs:p-4 sm:p-6 pt-6 xs:pt-8">
        {/* Breadcrumb Trail - Mobile Scrollable */}
        <div className="flex items-center space-x-1 xs:space-x-2 text-xs xs:text-sm text-gray-600 mb-3 xs:mb-4 overflow-x-auto pb-1">
          <BookOpen className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
          <span className="hover:text-gray-900 cursor-pointer whitespace-nowrap" onClick={() => onNavigate({ view: 'course' })}>
            Course
          </span>
          <span className="flex-shrink-0">→</span>
          <span className="hover:text-gray-900 cursor-pointer whitespace-nowrap truncate">
            {unitTitle}
          </span>
          <span className="flex-shrink-0">→</span>
          <span className="hover:text-gray-900 cursor-pointer whitespace-nowrap truncate">
            {topicTitle}
          </span>
          <span className="flex-shrink-0">→</span>
          <span className="hover:text-gray-900 cursor-pointer whitespace-nowrap truncate">
            {subtopicTitle}
          </span>
          <span className="flex-shrink-0">→</span>
          <span className="font-medium text-gray-900 whitespace-nowrap truncate">{module.title}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight pr-2">{module.title}</h1>
          <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-1 xs:space-x-2 text-xs xs:text-sm text-gray-600">
              <Clock className="h-3 w-3 xs:h-4 xs:w-4" />
              <span>{formatTime(readingTime)} / {module.estimatedMinutes} min</span>
            </div>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800 text-xs xs:text-sm">
                <CheckCircle2 className="h-2 w-2 xs:h-3 xs:w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

        {/* Content Area - Mobile Responsive */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-3 xs:p-4 sm:p-6 lg:p-8 space-y-4 xs:space-y-6 lg:space-y-8">
            {!showQuiz ? (
              <>
                {/* Enhanced Dynamic Content Display */}
                <EnhancedDynamicContentRenderer
                  content={module.content}
                  title={module.title}
                  learningObjective={module.learning_objective}
                  generatedCode={module.generated_code}
                  moduleId={module.id}
                  stylePreferences={courseStylePreferences || {
                    primaryColor: '#3b82f6',
                    secondaryColor: '#8b5cf6', 
                    fontFamily: 'Inter',
                    fontSize: 'medium',
                    animationStyle: 'fade',
                    layoutStyle: 'single-column'
                  }}
                />

                {/* Real World Application - Mobile Responsive */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2 xs:pb-3 p-3 xs:p-4 sm:p-6">
                    <CardTitle className="flex items-center space-x-2 text-green-800 text-sm xs:text-base lg:text-lg">
                      <Lightbulb className="h-4 w-4 xs:h-5 xs:w-5" />
                      <span>Real-World Application</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
                    <p className="text-green-700 leading-relaxed text-sm xs:text-base lg:text-lg">
                      Consider how these concepts apply in your daily work or business decisions. 
                      The frameworks you're learning are used by top companies to make strategic 
                      choices that drive success.
                    </p>
                  </CardContent>
                </Card>

                {/* Audio Player - after Real-World Application */}
                <div className="mt-3 xs:mt-4">
                  <ModuleAudioPlayer 
                    content={module.content} 
                    title={module.title}
                    generatedCode={module.generated_code}
                  />
                </div>

                {/* Knowledge Check CTA - Mobile Responsive */}
                {effectiveQuiz && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader className="pb-2 xs:pb-3 p-3 xs:p-4 sm:p-6">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-purple-800 text-sm xs:text-base lg:text-lg">
                          <HelpCircle className="h-4 w-4 xs:h-5 xs:w-5" />
                          <span>Ready for Knowledge Check?</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
                      <p className="text-purple-700 mb-3 xs:mb-4 text-sm xs:text-base">
                        Test your understanding with an interactive quiz that reinforces what you've learned.
                      </p>
                      <Button
                        onClick={() => setShowQuiz(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white w-full xs:w-auto text-sm xs:text-base"
                      >
                        Start Knowledge Check
                        <ArrowRight className="h-3 w-3 xs:h-4 xs:w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              (
                <GamifiedQuiz
                  quiz={effectiveQuiz}
                  onComplete={(score) => {
                    if (!quizCompleted) {
                      setQuizCompleted(true);
                      onQuizComplete(score);
                    }
                  }}
                  onNext={() => {
                    if (!quizCompleted) {
                      setQuizCompleted(true);
                      onNext();
                    }
                  }}
                />
              )
            )}
          </div>
        </div>

        {/* Navigation Footer - Mobile Responsive */}
        <div className="bg-white border-t border-gray-200 p-3 xs:p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Mobile Layout - Stacked */}
            <div className="flex flex-col space-y-3 sm:hidden">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuiz(false);
                  window.scrollTo(0, 0);
                }}
                className="flex items-center justify-center space-x-2 w-full"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Review Content</span>
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={onPrevious}
                  className="flex items-center justify-center space-x-1 text-sm"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Previous</span>
                </Button>
                <Button
                  onClick={onNext}
                  className="flex items-center justify-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Horizontal */}
            <div className="hidden sm:flex items-center justify-between">
              <Button
                variant="outline"
                onClick={onPrevious}
                className="flex items-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 border-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Previous Module</span>
                <span className="md:hidden">Previous</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setShowQuiz(false);
                  window.scrollTo(0, 0);
                }}
                className="flex items-center space-x-2 px-3 lg:px-4"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden lg:inline">Review Content</span>
                <span className="lg:hidden">Review</span>
              </Button>

              <Button
                onClick={onNext}
                className="flex items-center space-x-2 px-4 lg:px-6 py-2 lg:py-3 bg-indigo-600 hover:bg-indigo-700"
              >
                <span className="hidden md:inline">Next Module</span>
                <span className="md:hidden">Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
