import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Target,
  Lightbulb,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicroModule {
  title: string;
  content: string;
  learning_objective: string;
  estimated_duration_minutes?: number;
  quick_quiz?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  };
  real_world_example?: string;
}

interface EnhancedContentAreaProps {
  module: MicroModule;
  topicTitle: string;
  subtopicTitle: string;
  moduleIndex: number;
  totalModules: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete: () => void;
  isCompleted: boolean;
  progress: number;
}

export function EnhancedContentArea({
  module,
  topicTitle,
  subtopicTitle,
  moduleIndex,
  totalModules,
  onPrevious,
  onNext,
  onComplete,
  isCompleted,
  progress
}: EnhancedContentAreaProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [startTime] = useState(Date.now());

  // Calculate estimated reading time
  const estimatedReadTime = Math.max(1, Math.ceil((module.content.length + (module.real_world_example?.length || 0)) / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    // Auto-complete if answer is correct
    if (module.quick_quiz && answerIndex === module.quick_quiz.correct && !isCompleted) {
      setTimeout(() => {
        onComplete();
      }, 2000);
    }
  };

  const renderContent = (content: string) => {
    // Enhanced content rendering with better formatting
    return content.split('\n\n').map((paragraph, index) => {
      if (paragraph.trim().startsWith('#')) {
        const level = paragraph.match(/^#+/)?.[0].length || 1;
        const text = paragraph.replace(/^#+\s*/, '');
        const HeadingTag = `h${Math.min(level + 1, 6)}` as keyof JSX.IntrinsicElements;
        
        return (
          <HeadingTag 
            key={index} 
            className={cn(
              "font-bold mb-3 text-gray-900",
              level === 1 && "text-xl",
              level === 2 && "text-lg",
              level >= 3 && "text-base"
            )}
          >
            {text}
          </HeadingTag>
        );
      }
      
      if (paragraph.trim().startsWith('*') || paragraph.trim().startsWith('-')) {
        const items = paragraph.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-4 text-gray-700">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="leading-relaxed">
                {item.replace(/^[*-]\s*/, '')}
              </li>
            ))}
          </ul>
        );
      }
      
      return (
        <p key={index} className="mb-4 leading-relaxed text-gray-700">
          {paragraph}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header with breadcrumbs and progress */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BookOpen className="h-4 w-4" />
              <span>{topicTitle}</span>
              <span>→</span>
              <span>{subtopicTitle}</span>
              <span>→</span>
              <span className="font-medium text-gray-900">{module.title}</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatTime(readingTime)} / {estimatedReadTime} min</span>
              </div>
              {isCompleted && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            <div className="text-sm text-gray-600">
              Module {moduleIndex + 1} of {totalModules}
            </div>
          </div>
          
          <Progress value={progress} className="mt-4 h-2" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Learning Objective */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Target className="h-5 w-5" />
                  <span>Learning Objective</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 font-medium">{module.learning_objective}</p>
              </CardContent>
            </Card>

            {/* Main Content */}
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-gray max-w-none">
                  {renderContent(module.content)}
                </div>
              </CardContent>
            </Card>

            {/* Real World Example */}
            {module.real_world_example && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-green-800">
                    <Lightbulb className="h-5 w-5" />
                    <span>Real-World Application</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700 leading-relaxed">{module.real_world_example}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Quiz */}
            {module.quick_quiz && (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-purple-800">
                      <HelpCircle className="h-5 w-5" />
                      <span>Quick Knowledge Check</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuiz(!showQuiz)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      {showQuiz ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showQuiz ? 'Hide' : 'Show'} Quiz
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showQuiz && (
                  <CardContent>
                    <div className="space-y-4">
                      <p className="font-medium text-purple-800">{module.quick_quiz.question}</p>
                      <div className="space-y-2">
                        {module.quick_quiz.options.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedAnswer === index ? "default" : "outline"}
                            className={cn(
                              "w-full justify-start text-left p-4 h-auto",
                              selectedAnswer === index && showExplanation && (
                                index === module.quick_quiz!.correct 
                                  ? "bg-green-100 border-green-500 text-green-800" 
                                  : "bg-red-100 border-red-500 text-red-800"
                              )
                            )}
                            onClick={() => handleQuizAnswer(index)}
                            disabled={showExplanation}
                          >
                            <span className="mr-3 font-bold">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            {option}
                            {showExplanation && index === module.quick_quiz!.correct && (
                              <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />
                            )}
                          </Button>
                        ))}
                      </div>
                      {showExplanation && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                          <p className="text-sm text-gray-700">
                            <strong>Explanation:</strong> {module.quick_quiz.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!onPrevious}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              {!isCompleted && (
                <Button
                  onClick={onComplete}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
              
              <Button
                onClick={onNext}
                disabled={!onNext}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
