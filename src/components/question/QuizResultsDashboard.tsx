import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, BarChart3, Trophy, Clock, Target } from "lucide-react";

interface QuizAttempt {
  questionId: string;
  question: string;
  userAnswer: string | number;
  correctAnswer: string | number;
  isCorrect: boolean;
  timeSpent?: number;
  timestamp: Date;
  questionType: 'mcq' | 'true_false';
}

interface QuizResultsDashboardProps {
  attempts: QuizAttempt[];
  isVisible: boolean;
}

export const QuizResultsDashboard: React.FC<QuizResultsDashboardProps> = ({
  attempts,
  isVisible
}) => {
  const [overallStats, setOverallStats] = useState({
    totalAttempts: 0,
    correctAnswers: 0,
    accuracy: 0,
    averageTime: 0,
    streakCurrent: 0,
    streakBest: 0
  });

  const [typeStats, setTypeStats] = useState({
    mcq: { total: 0, correct: 0, accuracy: 0 },
    true_false: { total: 0, correct: 0, accuracy: 0 }
  });

  useEffect(() => {
    if (attempts.length === 0) return;

    // Calculate overall stats
    const totalAttempts = attempts.length;
    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalAttempts) * 100);
    
    const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const averageTime = Math.round(totalTime / totalAttempts);

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Calculate from most recent backwards for current streak
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].isCorrect) {
        if (i === attempts.length - 1) currentStreak++;
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        if (i === attempts.length - 1) currentStreak = 0;
        tempStreak = 0;
      }
    }

    setOverallStats({
      totalAttempts,
      correctAnswers,
      accuracy,
      averageTime,
      streakCurrent: currentStreak,
      streakBest: bestStreak
    });

    // Calculate type-specific stats
    const mcqAttempts = attempts.filter(a => a.questionType === 'mcq');
    const tfAttempts = attempts.filter(a => a.questionType === 'true_false');

    const mcqCorrect = mcqAttempts.filter(a => a.isCorrect).length;
    const tfCorrect = tfAttempts.filter(a => a.isCorrect).length;

    setTypeStats({
      mcq: {
        total: mcqAttempts.length,
        correct: mcqCorrect,
        accuracy: mcqAttempts.length > 0 ? Math.round((mcqCorrect / mcqAttempts.length) * 100) : 0
      },
      true_false: {
        total: tfAttempts.length,
        correct: tfCorrect,
        accuracy: tfAttempts.length > 0 ? Math.round((tfCorrect / tfAttempts.length) * 100) : 0
      }
    });
  }, [attempts]);

  if (!isVisible || attempts.length === 0) {
    return null;
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-600";
    if (accuracy >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBadgeVariant = (accuracy: number) => {
    if (accuracy >= 80) return "default";
    if (accuracy >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Quiz Performance Dashboard</h3>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-type">By Question Type</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.totalAttempts}</div>
                <p className="text-xs text-muted-foreground">
                  {overallStats.correctAnswers} correct answers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getAccuracyColor(overallStats.accuracy)}`}>
                  {overallStats.accuracy}%
                </div>
                <Progress value={overallStats.accuracy} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {overallStats.streakCurrent}
                </div>
                <p className="text-xs text-muted-foreground">
                  Best: {overallStats.streakBest}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallStats.averageTime}s</div>
                <p className="text-xs text-muted-foreground">per question</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-type" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multiple Choice Questions</CardTitle>
                <CardDescription>Your performance on MCQ questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Attempted:</span>
                  <Badge variant="outline">{typeStats.mcq.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Correct Answers:</span>
                  <Badge variant="default">{typeStats.mcq.correct}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy:</span>
                  <Badge variant={getAccuracyBadgeVariant(typeStats.mcq.accuracy)}>
                    {typeStats.mcq.accuracy}%
                  </Badge>
                </div>
                <Progress value={typeStats.mcq.accuracy} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">True/False Questions</CardTitle>
                <CardDescription>Your performance on True/False questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Attempted:</span>
                  <Badge variant="outline">{typeStats.true_false.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Correct Answers:</span>
                  <Badge variant="default">{typeStats.true_false.correct}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Accuracy:</span>
                  <Badge variant={getAccuracyBadgeVariant(typeStats.true_false.accuracy)}>
                    {typeStats.true_false.accuracy}%
                  </Badge>
                </div>
                <Progress value={typeStats.true_false.accuracy} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Quiz Attempts</CardTitle>
              <CardDescription>Your latest question attempts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attempts.slice(-10).reverse().map((attempt, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {attempt.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium truncate max-w-md" title={attempt.question}>
                          {attempt.question}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attempt.questionType.replace('_', ' ')} • {attempt.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={attempt.isCorrect ? "default" : "secondary"}>
                        {attempt.isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                      {attempt.timeSpent && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {attempt.timeSpent}s
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};