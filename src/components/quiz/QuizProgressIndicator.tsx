import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Circle, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";

interface QuizAnswer {
  questionIndex: number;
  answer: string | number;
  isCorrect: boolean;
  timeSpent: number;
}

interface QuizProgressIndicatorProps {
  totalQuestions: number;
  currentQuestion: number;
  answers: QuizAnswer[];
  showDetailedProgress?: boolean;
  compact?: boolean;
}

export const QuizProgressIndicator: React.FC<QuizProgressIndicatorProps> = ({
  totalQuestions,
  currentQuestion,
  answers,
  showDetailedProgress = false,
  compact = false
}) => {
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const currentScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{currentQuestion + 1}</span>
          <span className="text-muted-foreground">of</span>
          <span className="font-medium">{totalQuestions}</span>
        </div>
        <Progress value={progressPercentage} className="flex-1 h-2" />
        <Badge variant="secondary">
          {Math.round(progressPercentage)}%
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">
            Question {currentQuestion + 1} of {totalQuestions}
          </h3>
          <Badge variant="outline" className="text-xs">
            {Math.round(progressPercentage)}% Complete
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-3" />
      </div>

      {/* Question Dots Navigation */}
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const questionAnswer = answers.find(a => a.questionIndex === index);
          const isAnswered = !!questionAnswer;
          const isCorrect = questionAnswer?.isCorrect;
          const isCurrent = index === currentQuestion;
          
          return (
            <div
              key={index}
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all cursor-pointer",
                isCurrent
                  ? "border-primary bg-primary text-white scale-110 shadow-lg"
                  : isAnswered
                  ? isCorrect
                    ? "border-green-500 bg-green-500 text-white hover:scale-105"
                    : "border-red-500 bg-red-500 text-white hover:scale-105"
                  : index < currentQuestion
                  ? "border-gray-400 bg-gray-100 text-gray-500"
                  : "border-gray-300 bg-gray-50 text-gray-400"
              )}
              title={
                isAnswered
                  ? `Question ${index + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`
                  : `Question ${index + 1}: ${index <= currentQuestion ? 'Available' : 'Locked'}`
              }
            >
              {isAnswered ? (
                isCorrect ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )
              ) : index === currentQuestion ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Progress Stats */}
      {showDetailedProgress && (
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="font-medium">{correctAnswers}</span>
            <span className="text-muted-foreground">Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="font-medium">{answers.length - correctAnswers}</span>
            <span className="text-muted-foreground">Incorrect</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{totalQuestions - answers.length}</span>
            <span className="text-muted-foreground">Remaining</span>
          </div>
          {answers.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant={currentScore >= 70 ? "default" : "destructive"}>
                {currentScore}% Score
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
};