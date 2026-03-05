
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Target,
  Trophy,
  PlayCircle,
  Pause,
  RotateCcw
} from "lucide-react";
import { MicroModule, useMicroModules } from "@/hooks/useMicroModules";

interface MicroModuleViewerProps {
  courseId: string;
}

export function MicroModuleViewer({ courseId }: MicroModuleViewerProps) {
  const {
    microModules,
    currentModule,
    currentModuleIndex,
    completeModule,
    goToNextModule,
    goToPreviousModule,
    getProgressStats,
    loading
  } = useMicroModules(courseId);

  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  const progressStats = getProgressStats();

  useEffect(() => {
    setStartTime(Date.now());
    setQuizAnswer('');
    setShowQuizResult(false);
    setIsCompleted(false);
  }, [currentModuleIndex]);

  const handleQuizSubmit = () => {
    if (!currentModule?.quick_quiz) return;

    const correct = parseInt(quizAnswer) === currentModule.quick_quiz.correct;
    const score = correct ? 100 : 0;
    setQuizScore(score);
    setShowQuizResult(true);
  };

  const handleCompleteModule = async () => {
    if (!currentModule) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const success = await completeModule(currentModule.id, quizScore, timeSpent);
    
    if (success) {
      setIsCompleted(true);
      setTimeout(() => {
        goToNextModule();
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <PlayCircle className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600">Loading your micro-modules...</p>
        </div>
      </div>
    );
  }

  if (!currentModule) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Congratulations! 🎉</h3>
            <p className="text-gray-600 max-w-sm">
              You've completed all micro-modules in this course. Amazing work!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Badge className="bg-blue-600 text-white mb-2">
              Micro-Module {progressStats.currentModuleNumber} of {progressStats.totalModules}
            </Badge>
            <h1 className="text-2xl font-bold text-gray-900">{currentModule.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{progressStats.progressPercentage}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>
        
        <Progress value={progressStats.progressPercentage} className="h-3 mb-4" />
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-medium">{currentModule.estimated_duration_minutes} min</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <Target className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-sm font-medium">Focused Learning</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <CheckCircle className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <div className="text-sm font-medium">{progressStats.completedModules} Completed</div>
          </div>
        </div>
      </div>

      {/* Module Content */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="flex items-center gap-2 text-xl">
            <PlayCircle className="h-6 w-6 text-blue-600" />
            Learning Objective
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-blue-800 font-medium">{currentModule.learning_objective}</p>
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-line text-gray-800 leading-relaxed">
              {currentModule.content}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Quiz */}
      {currentModule.quick_quiz && currentModule.quick_quiz.question && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-6 w-6 text-green-600" />
              Quick Knowledge Check
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">
                {currentModule.quick_quiz.question}
              </h4>
              
              {!showQuizResult ? (
                <div className="space-y-4">
                  <RadioGroup value={quizAnswer} onValueChange={setQuizAnswer}>
                    {currentModule.quick_quiz.options?.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="text-gray-700">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  <Button 
                    onClick={handleQuizSubmit}
                    disabled={!quizAnswer}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Answer
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    quizScore === 100 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="font-semibold mb-2">
                      {quizScore === 100 ? '✅ Correct!' : '❌ Not quite right'}
                    </div>
                    <p>{currentModule.quick_quiz.explanation}</p>
                  </div>
                  
                  {!isCompleted && (
                    <Button 
                      onClick={handleCompleteModule}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Micro-Module
                    </Button>
                  )}
                  
                  {isCompleted && (
                    <div className="bg-green-100 border border-green-300 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Micro-Module Completed!</span>
                      </div>
                      <p className="text-green-700 mt-1">Moving to next micro-module...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousModule}
              disabled={currentModuleIndex === 0}
              className="flex items-center gap-2 px-6 py-3 border-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setStartTime(Date.now())}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restart
              </Button>
            </div>

            <Button
              onClick={goToNextModule}
              disabled={currentModuleIndex === microModules.length - 1}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
