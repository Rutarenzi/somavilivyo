import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Download,
  Share2,
  Star,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizAnswer {
  questionIndex: number;
  answer: string | number;
  isCorrect: boolean;
  timeSpent: number;
}

interface QuizResultsSummaryProps {
  answers: QuizAnswer[];
  totalQuestions: number;
  totalTimeSpent: number;
  onRetry?: () => void;
  onClose?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  quizTitle?: string;
}

export const QuizResultsSummary: React.FC<QuizResultsSummaryProps> = ({
  answers,
  totalQuestions,
  totalTimeSpent,
  onRetry,
  onClose,
  onExport,
  onShare,
  quizTitle = "Quiz Complete"
}) => {
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answers.length - correctAnswers;
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const averageTimePerQuestion = Math.round(totalTimeSpent / totalQuestions / 1000);

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const gradeInfo = getScoreGrade(score);

  const achievements = [
    {
      title: "Quiz Completed",
      description: "Finished all questions",
      icon: Trophy,
      earned: answers.length === totalQuestions,
      color: "text-blue-500"
    },
    {
      title: "Perfect Score",
      description: "100% correct answers",
      icon: Star,
      earned: score === 100,
      color: "text-yellow-500"
    },
    {
      title: "High Achiever",
      description: "Score above 80%",
      icon: TrendingUp,
      earned: score >= 80,
      color: "text-green-500"
    },
    {
      title: "Quick Learner",
      description: "Fast completion time",
      icon: Clock,
      earned: averageTimePerQuestion <= 30,
      color: "text-purple-500"
    }
  ];

  return (
    <Card className="max-w-2xl mx-auto border-0 shadow-2xl">
      <CardHeader className="text-center bg-gradient-to-r from-primary/90 to-primary text-white">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-2xl">{quizTitle}</CardTitle>
        <CardDescription className="text-white/80">
          Here's how you performed
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {/* Score Display */}
        <div className="text-center space-y-4">
          <div className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center mx-auto border-8",
            score >= 70 ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
          )}>
            <div className="text-center">
              <div className={cn("text-4xl font-bold", gradeInfo.color)}>
                {score}%
              </div>
              <div className={cn("text-lg font-semibold", gradeInfo.color)}>
                Grade {gradeInfo.grade}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{averageTimePerQuestion}s</div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Overall Performance</span>
            <span>{score}%</span>
          </div>
          <Progress value={score} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          <h3 className="font-semibold">Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  achievement.earned
                    ? "border-primary/20 bg-primary/5"
                    : "border-gray-200 bg-gray-50 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <achievement.icon className={cn(
                    "h-5 w-5",
                    achievement.earned ? achievement.color : "text-gray-400"
                  )} />
                  <div>
                    <div className={cn(
                      "text-sm font-medium",
                      achievement.earned ? "text-gray-900" : "text-gray-500"
                    )}>
                      {achievement.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.earned && (
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Feedback */}
        <Card className={cn("p-4", gradeInfo.bg)}>
          <div className="flex items-start gap-3">
            <Target className={cn("h-5 w-5 mt-0.5", gradeInfo.color)} />
            <div>
              <h4 className={cn("font-semibold", gradeInfo.color)}>
                {score >= 90 ? "Outstanding Performance!" :
                 score >= 70 ? "Great Job!" :
                 score >= 50 ? "Good Effort!" :
                 "Keep Learning!"}
              </h4>
              <p className={cn("text-sm mt-1", gradeInfo.color.replace('600', '700'))}>
                {score >= 90 ? "You've mastered this material! Your understanding is excellent." :
                 score >= 70 ? "You have a solid grasp of the concepts. Well done!" :
                 score >= 50 ? "You're on the right track. Review the explanations and try again." :
                 "Don't worry! Learning takes time. Review the material and practice more."}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center pt-4">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry Quiz
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Download Results
            </Button>
          )}
          {onShare && (
            <Button variant="outline" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
          {onClose && (
            <Button onClick={onClose}>
              Continue Learning
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};