import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLearningInsights } from "@/hooks/useLearningInsights";
import { useContentAnalytics } from "@/hooks/useContentAnalytics";
import { TrendingUp, Brain, Target, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { OptimizedSkeleton } from "@/components/ui/optimized-skeleton";

interface OptimizedProgressDashboardProps {
  courseId: string;
  className?: string;
}

const OptimizedProgressDashboard = memo(({ courseId, className }: OptimizedProgressDashboardProps) => {
  const { insights, loading: insightsLoading } = useLearningInsights(courseId);
  const analytics = useContentAnalytics(courseId, '');
  const analyticsLoading = false; // Mock for now

  // Simplified mock data for now - will be enhanced later
  const dashboardData = useMemo(() => {
    return {
      totalModules: 10,
      completedModules: 6,
      progressPercentage: 60,
      averageScore: 85,
      timeSpent: 120,
      lastActivity: new Date().toISOString(),
      isActive: true
    };
  }, []);

  // Memoized insights
  const topInsights = useMemo(() => {
    return insights
      .filter(insight => insight.is_active)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }, [insights]);

  if (insightsLoading || analyticsLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <OptimizedSkeleton className="h-32" />
        <OptimizedSkeleton className="h-24" />
        <OptimizedSkeleton className="h-28" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Card className={`glass bg-white/80 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span>No Progress Data</span>
          </CardTitle>
          <CardDescription>
            Start learning to see your progress dashboard
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Progress Card */}
      <Card className="glass bg-white/80 shadow-lg border-white/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <span>Learning Progress</span>
            </CardTitle>
            {dashboardData.isActive && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">{dashboardData.progressPercentage}%</span>
            </div>
            <Progress 
              value={dashboardData.progressPercentage} 
              className="h-3 bg-gray-100"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{dashboardData.completedModules} completed</span>
              <span>{dashboardData.totalModules} total modules</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Score</p>
                <p className="text-lg font-semibold text-blue-700">{dashboardData.averageScore}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Time Spent</p>
                <p className="text-lg font-semibold text-purple-700">{dashboardData.timeSpent}m</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      {topInsights.length > 0 && (
        <Card className="glass bg-white/80 shadow-lg border-white/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Learning Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInsights.map((insight) => (
              <div 
                key={insight.id}
                className="flex items-start space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  {insight.insight_type === 'strength' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-emerald-800 text-sm">{insight.title}</h4>
                  <p className="text-xs text-emerald-600 mt-1 line-clamp-2">{insight.description}</p>
                  {insight.action_items && insight.action_items.length > 0 && (
                    <p className="text-xs text-emerald-500 mt-2 font-medium">
                      Next: {insight.action_items[0]}
                    </p>
                  )}
                </div>
                <Badge 
                  variant="outline" 
                  className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700"
                >
                  Priority {insight.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
});

OptimizedProgressDashboard.displayName = 'OptimizedProgressDashboard';

export { OptimizedProgressDashboard };