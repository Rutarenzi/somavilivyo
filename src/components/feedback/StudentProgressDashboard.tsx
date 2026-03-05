import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Brain, Target, Clock, Award, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useLearningInsights } from '@/hooks/useLearningInsights';
import { useEnhancedCourseManagement } from '@/hooks/useEnhancedCourseManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { performanceCache } from '@/utils/performanceCache';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

interface StudentProgressDashboardProps {
  courseId: string;
}

interface ProgressStats {
  totalModules: number;
  completedModules: number;
  averageQuizScore: number;
  totalTimeSpent: number;
  weeklyProgress: Array<{
    week: string;
    completion: number;
    timeSpent: number;
    quizScore: number;
  }>;
  engagementData: Array<{
    date: string;
    engagement: number;
    modulesCompleted: number;
  }>;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = ({ courseId }) => {
  const { insights, competencies, loading: insightsLoading } = useLearningInsights(courseId);
  const { courses, getCourseProgress } = useEnhancedCourseManagement();
  const { user } = useAuth();
  const { subscribe } = useRealtimeManager();
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    totalModules: 0,
    completedModules: 0,
    averageQuizScore: 0,
    totalTimeSpent: 0,
    weeklyProgress: [],
    engagementData: []
  });
  const [loading, setLoading] = useState(true);
  
  const course = courses.find(c => c.id === courseId);
  const overallProgress = course ? getCourseProgress(course) : 0;

  const fetchRealProgressData = useCallback(async () => {
    if (!user || !courseId) return;

    const cacheKey = `dashboard-progress-${courseId}-${user.id}`;
    const cachedData = performanceCache.get<ProgressStats>(cacheKey);
    
    if (cachedData) {
      setProgressStats(cachedData);
      setLoading(false);
      return;
    }

    try {
      // Batch all queries using Promise.all for better performance
      const [
        { data: microProgress, error: progressError },
        { data: analytics, error: analyticsError },
        { data: modules, error: modulesError }
      ] = await Promise.all([
        supabase
          .from('user_micro_progress')
          .select('completed_at, quiz_score, time_spent_seconds')
          .eq('user_id', user.id)
          .eq('course_id', courseId),
        supabase
          .from('learning_analytics')
          .select('created_at, engagement_score')
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false })
          .limit(100), // Limit to prevent over-fetching
        supabase
          .from('micro_modules')
          .select('id')
          .eq('course_id', courseId)
      ]);

      if (progressError) throw progressError;
      if (analyticsError) throw analyticsError;
      if (modulesError) throw modulesError;

      // Calculate real statistics
      const totalModules = modules?.length || 0;
      const completedModules = microProgress?.filter(p => p.completed_at).length || 0;
      const averageQuizScore = microProgress?.length > 0 
        ? Math.round(microProgress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / microProgress.length)
        : 0;
      const totalTimeSpent = microProgress?.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0) || 0;

      // Generate weekly progress data from actual completion dates
      const weeklyData = generateWeeklyProgressData(microProgress || []);
      
      // Generate engagement data from analytics
      const engagementData = generateEngagementData(analytics || []);

      const newProgressStats = {
        totalModules,
        completedModules,
        averageQuizScore,
        totalTimeSpent,
        weeklyProgress: weeklyData,
        engagementData
      };

      setProgressStats(newProgressStats);
      
      // Cache the result for 5 minutes
      performanceCache.set(cacheKey, newProgressStats, 5 * 60 * 1000);

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, courseId]);

  const generateWeeklyProgressData = useMemo(() => (progressData: any[]) => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekProgress = progressData.filter(p => {
        if (!p.completed_at) return false;
        const completedDate = new Date(p.completed_at);
        return completedDate >= weekStart && completedDate < weekEnd;
      });

      const avgQuizScore = weekProgress.length > 0
        ? weekProgress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / weekProgress.length
        : 0;

      const totalTime = weekProgress.reduce((sum, p) => sum + (p.time_spent_seconds || 0), 0);

      weeks.push({
        week: `Week ${4 - i}`,
        completion: weekProgress.length,
        timeSpent: Math.round(totalTime / 60), // Convert to minutes
        quizScore: Math.round(avgQuizScore)
      });
    }
    
    return weeks;
  }, []);

  const generateEngagementData = useMemo(() => (analyticsData: any[]) => {
    const last7Days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayAnalytics = analyticsData.filter(a => {
        const createdDate = new Date(a.created_at);
        return createdDate >= date && createdDate <= dayEnd;
      });

      const avgEngagement = dayAnalytics.length > 0
        ? dayAnalytics.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / dayAnalytics.length
        : 0;

      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        engagement: Math.round(avgEngagement * 100),
        modulesCompleted: dayAnalytics.filter(a => a.engagement_score > 0.8).length
      });
    }
    
    return last7Days;
  }, []);

  // Set up real-time subscriptions using centralized manager with debouncing
  useEffect(() => {
    fetchRealProgressData();

    if (!user || !courseId) return;

    // Debounce function to prevent excessive refetches
    let debounceTimer: NodeJS.Timeout;
    const debouncedRefetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Clear cache before refetching to ensure fresh data
        performanceCache.invalidatePattern(`dashboard-progress-${courseId}-${user.id}`);
        fetchRealProgressData();
      }, 1000);
    };

    const progressSubscriberId = `dashboard-progress-${courseId}-${user.id}`;
    const analyticsSubscriberId = `dashboard-analytics-${courseId}-${user.id}`;

    const unsubscribeProgress = subscribe(progressSubscriberId, {
      table: 'user_micro_progress',
      filter: `user_id=eq.${user.id}`,
      event: '*',
      callback: debouncedRefetch
    });

    const unsubscribeAnalytics = subscribe(analyticsSubscriberId, {
      table: 'learning_analytics',
      filter: `user_id=eq.${user.id}`,
      event: '*',
      callback: debouncedRefetch
    });

    return () => {
      clearTimeout(debounceTimer);
      unsubscribeProgress();
      unsubscribeAnalytics();
    };
  }, [user, courseId, subscribe, fetchRealProgressData]);

  const competencyColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  if (loading || insightsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Learning Progress Dashboard</h2>
          <p className="text-gray-600 mt-2">Track your learning journey with real-time data and insights</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{Math.round(overallProgress)}%</div>
          <div className="text-sm text-gray-500">Overall Progress</div>
        </div>
      </div>

      {/* Real-time Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
            <Progress value={overallProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progressStats.completedModules} of {progressStats.totalModules} modules completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quiz Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressStats.averageQuizScore}%</div>
            <p className="text-xs text-muted-foreground">
              {progressStats.averageQuizScore >= 80 ? 'Excellent performance!' : 
               progressStats.averageQuizScore >= 70 ? 'Good progress!' : 'Keep practicing!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">Personalized recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(progressStats.totalTimeSpent / 3600)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(progressStats.totalTimeSpent / 60)} minutes total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competencies">Skills</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress Trend</CardTitle>
                <CardDescription>Your actual learning progress over the past 4 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressStats.weeklyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="completion" stroke="#8884d8" strokeWidth={2} name="Modules Completed" />
                    <Line type="monotone" dataKey="quizScore" stroke="#82ca9d" strokeWidth={2} name="Avg Quiz Score" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Engagement</CardTitle>
                <CardDescription>Your learning engagement over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressStats.engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="engagement" fill="#8884d8" name="Engagement Score" />
                    <Bar dataKey="modulesCompleted" fill="#82ca9d" name="Modules Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competencies" className="space-y-4">
          <div className="grid gap-4">
            {competencies.length > 0 ? competencies.map((competency) => (
              <Card key={competency.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{competency.competency_name}</CardTitle>
                    <Badge variant={
                      competency.current_level === 'expert' ? 'default' :
                      competency.current_level === 'advanced' ? 'secondary' :
                      competency.current_level === 'intermediate' ? 'outline' : 'destructive'
                    }>
                      {competency.current_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Mastery Level</span>
                      <span className="text-sm text-gray-600">{competency.mastery_percentage}%</span>
                    </div>
                    <Progress value={competency.mastery_percentage} />
                    
                    {competency.skill_gaps.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement:</h4>
                        <div className="flex flex-wrap gap-2">
                          {competency.skill_gaps.map((gap, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {gap}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No competency data available yet. Complete more modules to see your skill tracking.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.length > 0 ? insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${
                insight.insight_type === 'strength' ? 'border-l-green-500' :
                insight.insight_type === 'weakness' ? 'border-l-red-500' :
                insight.insight_type === 'recommendation' ? 'border-l-blue-500' :
                'border-l-purple-500'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {insight.insight_type === 'strength' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                       insight.insight_type === 'weakness' ? <AlertCircle className="h-5 w-5 text-red-500" /> :
                       insight.insight_type === 'recommendation' ? <Target className="h-5 w-5 text-blue-500" /> :
                       <Brain className="h-5 w-5 text-purple-500" />}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <Badge variant={
                      insight.priority >= 4 ? 'destructive' :
                      insight.priority >= 3 ? 'default' : 'secondary'
                    }>
                      Priority {insight.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{insight.description}</p>
                  
                  {insight.action_items.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.action_items.map((action, index) => (
                          <li key={index} className="text-sm text-gray-600">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Confidence: {Math.round(insight.confidence_score * 100)}%</span>
                    <span>Generated: {new Date(insight.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No insights available yet. Continue learning to receive personalized recommendations.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>
              <CardDescription>Detailed breakdown of your actual learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={progressStats.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completion" fill="#8884d8" name="Modules Completed" />
                  <Bar dataKey="timeSpent" fill="#82ca9d" name="Time Spent (min)" />
                  <Bar dataKey="quizScore" fill="#ffc658" name="Avg Quiz Score" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ErrorBoundary>
  );
};
