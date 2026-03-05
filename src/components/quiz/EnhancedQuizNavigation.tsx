import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Info,
  Trophy,
  Target,
  Brain,
  Sparkles,
  Flag,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneratedQuestion } from '@/hooks/useQuestionGeneration';

interface QuizAnswer {
  questionIndex: number;
  answer: string | number;
  isCorrect: boolean;
  timeSpent: number;
}

interface EnhancedQuizNavigationProps {
  questions: GeneratedQuestion[];
  onComplete: (answers: QuizAnswer[], score: number) => void;
  onClose: () => void;
  title?: string;
}

export const EnhancedQuizNavigation: React.FC<EnhancedQuizNavigationProps> = ({
  questions,
  onComplete,
  onClose,
  title = "Interactive Quiz"
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string | number>('');
  const [showResult, setShowResult] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  // Check if current question has been answered
  const currentQuestionAnswer = answers.find(a => a.questionIndex === currentQuestionIndex);
  const hasAnswered = !!currentQuestionAnswer;

  useEffect(() => {
    setQuestionStartTime(Date.now());
    setCurrentAnswer('');
    setShowResult(false);
    setIsSubmitted(false);

    // Load previously saved answer if it exists
    const existingAnswer = answers.find(a => a.questionIndex === currentQuestionIndex);
    if (existingAnswer) {
      setCurrentAnswer(existingAnswer.answer);
      setShowResult(true);
      setIsSubmitted(true);
    }
  }, [currentQuestionIndex, answers]);

  const handleSubmitAnswer = () => {
    if (currentAnswer === '') return;

    const timeSpent = Date.now() - questionStartTime;
    let isCorrect = false;

    if (currentQuestion.type === 'mcq') {
      isCorrect = Number(currentAnswer) === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === 'true_false') {
      isCorrect = String(currentAnswer).toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase();
    }

    const newAnswer: QuizAnswer = {
      questionIndex: currentQuestionIndex,
      answer: currentAnswer,
      isCorrect,
      timeSpent
    };

    // Update or add answer
    const updatedAnswers = answers.filter(a => a.questionIndex !== currentQuestionIndex);
    updatedAnswers.push(newAnswer);
    setAnswers(updatedAnswers);
    
    setShowResult(true);
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishQuiz = () => {
    const totalScore = Math.round((answers.filter(a => a.isCorrect).length / totalQuestions) * 100);
    onComplete(answers, totalScore);
  };

  const handleRetryQuestion = () => {
    const updatedAnswers = answers.filter(a => a.questionIndex !== currentQuestionIndex);
    setAnswers(updatedAnswers);
    setCurrentAnswer('');
    setShowResult(false);
    setIsSubmitted(false);
    setQuestionStartTime(Date.now());
  };

  const getCorrectAnswerDisplay = () => {
    if (currentQuestion.type === 'mcq' && currentQuestion.options && typeof currentQuestion.correctAnswer === 'number') {
      return currentQuestion.options[currentQuestion.correctAnswer];
    }
    return String(currentQuestion.correctAnswer);
  };

  const renderAnswerOptions = () => {
    switch (currentQuestion.type) {
      case 'mcq':
        return (
          <RadioGroup
            value={String(currentAnswer)}
            onValueChange={(value) => setCurrentAnswer(Number(value))}
            disabled={isSubmitted}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className={cn(
                "group p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer",
                isSubmitted
                  ? index === currentQuestion.correctAnswer
                    ? "border-green-500 bg-green-50"
                    : index === Number(currentAnswer) && !currentQuestionAnswer?.isCorrect
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                  : String(currentAnswer) === String(index)
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/50"
              )}>
                <div className="flex items-center gap-4">
                  <RadioGroupItem 
                    value={String(index)} 
                    id={`option-${index}`}
                    className="text-primary"
                  />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {option}
                  </Label>
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold",
                    isSubmitted && index === currentQuestion.correctAnswer
                      ? "border-green-500 bg-green-500 text-white"
                      : isSubmitted && index === Number(currentAnswer) && !currentQuestionAnswer?.isCorrect
                      ? "border-red-500 bg-red-500 text-white"
                      : String(currentAnswer) === String(index)
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 text-gray-400"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'true_false':
        return (
          <RadioGroup
            value={String(currentAnswer)}
            onValueChange={setCurrentAnswer}
            disabled={isSubmitted}
            className="flex gap-4 justify-center"
          >
            {["True", "False"].map(val => (
              <div key={val} className={cn(
                "group p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer min-w-[120px]",
                isSubmitted
                  ? String(currentQuestion.correctAnswer).toLowerCase() === val.toLowerCase()
                    ? "border-green-500 bg-green-50"
                    : String(currentAnswer).toLowerCase() === val.toLowerCase() && !currentQuestionAnswer?.isCorrect
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                  : String(currentAnswer) === val
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/50"
              )}>
                <div className="flex flex-col items-center gap-2">
                  <RadioGroupItem 
                    value={val} 
                    id={`option-${val}`}
                    className="text-primary"
                  />
                  <Label 
                    htmlFor={`option-${val}`} 
                    className="cursor-pointer font-semibold text-center"
                  >
                    {val}
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        );
      
      default:
        return <p className="text-center text-muted-foreground">Question type not supported</p>;
    }
  };

  const renderProgressDots = () => (
    <div className="flex justify-center gap-2 my-4">
      {questions.map((_, index) => {
        const questionAnswer = answers.find(a => a.questionIndex === index);
        const isAnswered = !!questionAnswer;
        const isCorrect = questionAnswer?.isCorrect;
        const isCurrent = index === currentQuestionIndex;
        
        return (
          <button
            key={index}
            onClick={() => setCurrentQuestionIndex(index)}
            className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
              isCurrent
                ? "border-primary bg-primary text-white scale-110"
                : isAnswered
                ? isCorrect
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-red-500 bg-red-500 text-white"
                : "border-gray-300 bg-gray-100 text-gray-500 hover:border-primary/50"
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );

  return (
    <Card className="max-w-4xl mx-auto border-0 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-primary/90 to-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <p className="text-white/80 text-sm">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              <Target className="h-3 w-3 mr-1" />
              {Math.round(progress)}% Complete
            </Badge>
          </div>
          
          <Progress value={progress} className="h-2 bg-white/20" />
          {renderProgressDots()}
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {!showResult ? (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold text-gray-900">
                {currentQuestion.question}
              </h3>
            </div>

            <div className="space-y-4">
              {renderAnswerOptions()}
            </div>

            <div className="flex justify-center gap-3 pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleSubmitAnswer}
                disabled={currentAnswer === ''}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Submit Answer
              </Button>
              
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                currentQuestionAnswer?.isCorrect 
                  ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                  : "bg-gradient-to-r from-red-400 to-rose-500"
              )}>
                {currentQuestionAnswer?.isCorrect ? (
                  <CheckCircle className="h-10 w-10 text-white" />
                ) : (
                  <XCircle className="h-10 w-10 text-white" />
                )}
              </div>

              <h3 className={cn(
                "text-2xl font-bold",
                currentQuestionAnswer?.isCorrect ? "text-green-700" : "text-red-700"
              )}>
                {currentQuestionAnswer?.isCorrect ? "🎉 Correct!" : "🤔 Not quite right"}
              </h3>
            </div>

            <Alert className={cn(
              currentQuestionAnswer?.isCorrect 
                ? "bg-green-50 border-green-200" 
                : "bg-red-50 border-red-200"
            )}>
              <Info className="h-4 w-4" />
              <AlertTitle>
                {currentQuestionAnswer?.isCorrect ? "Well done!" : `Correct answer: ${getCorrectAnswerDisplay()}`}
              </AlertTitle>
              {currentQuestion.explanation && (
                <AlertDescription className="mt-2">
                  <strong>Explanation:</strong> {currentQuestion.explanation}
                </AlertDescription>
              )}
            </Alert>

            <div className="flex justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {!currentQuestionAnswer?.isCorrect && (
                <Button
                  variant="outline"
                  onClick={handleRetryQuestion}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}

              {currentQuestionIndex === totalQuestions - 1 && answers.length === totalQuestions ? (
                <Button
                  onClick={handleFinishQuiz}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Finish Quiz
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  Next Question
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Quiz Summary Footer */}
      <div className="px-8 pb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-4">
            <span>Answered: {answers.length}/{totalQuestions}</span>
            <span>Correct: {answers.filter(a => a.isCorrect).length}</span>
            <span>Score: {totalQuestions > 0 ? Math.round((answers.filter(a => a.isCorrect).length / totalQuestions) * 100) : 0}%</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Flag className="h-4 w-4 mr-2" />
            Exit Quiz
          </Button>
        </div>
      </div>
    </Card>
  );
};