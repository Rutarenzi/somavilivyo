import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Zap,
  RefreshCw,
  Target,
  BookOpen,
  PieChart
} from 'lucide-react';
import { ContentQualityValidator } from '@/utils/contentQualityValidator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CourseQualityStats {
  overallScore: number;
  moduleCount: number;
  qualifiedModules: number;
  improvements: string[];
  moduleBreakdown: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

interface CourseQualityDashboardProps {
  courseId: string;
  courseName: string;
}

export function CourseQualityDashboard({ courseId, courseName }: CourseQualityDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<CourseQualityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moduleMetrics, setModuleMetrics] = useState<any[]>([]);

  useEffect(() => {
    loadQualityStats();
    loadModuleMetrics();
  }, [courseId]);

  const loadQualityStats = async () => {
    try {
      const result = await ContentQualityValidator.validateCourseContent(courseId);
      
      // Get detailed breakdown
      const { data: metrics } = await supabase
        .from('module_quality_metrics')
        .select('quality_score')
        .eq('course_id', courseId);

      const breakdown = {
        excellent: metrics?.filter(m => m.quality_score >= 85).length || 0,
        good: metrics?.filter(m => m.quality_score >= 70 && m.quality_score < 85).length || 0,
        fair: metrics?.filter(m => m.quality_score >= 50 && m.quality_score < 70).length || 0,
        poor: metrics?.filter(m => m.quality_score < 50).length || 0
      };

      setStats({
        ...result,
        moduleBreakdown: breakdown
      });
    } catch (error) {
      console.error('Failed to load quality stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModuleMetrics = async () => {
    try {
      const { data: metrics } = await supabase
        .from('module_quality_metrics')
        .select(`
          *,
          micro_modules!inner(title, estimated_duration_minutes)
        `)
        .eq('course_id', courseId)
        .order('quality_score', { ascending: false });

      setModuleMetrics(metrics || []);
    } catch (error) {
      console.error('Failed to load module metrics:', error);
    }
  };

  const refreshAnalysis = async () => {
    setRefreshing(true);
    
    try {
      // Get all modules for this course
      const { data: modules } = await supabase
        .from('micro_modules')
        .select('id, title, content, quick_quiz')
        .eq('course_id', courseId);

      if (modules) {
        // Re-validate all modules
        for (const module of modules) {
          await ContentQualityValidator.validateContent(
            module.content,
            module.title,
            module.quick_quiz,
            module.id,
            courseId
          );
        }
      }

      // Reload stats
      await loadQualityStats();
      await loadModuleMetrics();
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load quality metrics.</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 85) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{courseName}</h2>
          <p className="text-gray-600">Content Quality Analysis</p>
        </div>
        <Button
          onClick={refreshAnalysis}
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-2 ${getScoreBg(stats.overallScore)}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className={`h-8 w-8 ${getScoreColor(stats.overallScore)}`} />
              <div>
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className={`text-2xl font-bold ${getScoreColor(stats.overallScore)}`}>
                  {Math.round(stats.overallScore)}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold text-blue-600">{stats.moduleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Quality Modules</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualifiedModules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((stats.qualifiedModules / stats.moduleCount) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Quality Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.moduleBreakdown.excellent}
              </div>
              <div className="text-sm text-gray-600">Excellent (85+)</div>
              <Progress 
                value={(stats.moduleBreakdown.excellent / stats.moduleCount) * 100} 
                className="mt-2 h-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.moduleBreakdown.good}
              </div>
              <div className="text-sm text-gray-600">Good (70-84)</div>
              <Progress 
                value={(stats.moduleBreakdown.good / stats.moduleCount) * 100} 
                className="mt-2 h-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.moduleBreakdown.fair}
              </div>
              <div className="text-sm text-gray-600">Fair (50-69)</div>
              <Progress 
                value={(stats.moduleBreakdown.fair / stats.moduleCount) * 100} 
                className="mt-2 h-2"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.moduleBreakdown.poor}
              </div>
              <div className="text-sm text-gray-600">Poor (&lt;50)</div>
              <Progress 
                value={(stats.moduleBreakdown.poor / stats.moduleCount) * 100} 
                className="mt-2 h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modules">Module Details</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          {moduleMetrics.map((metric) => (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {metric.micro_modules?.title || 'Untitled Module'}
                    </h4>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge 
                        variant={metric.quality_score >= 70 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        Score: {metric.quality_score}/100
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {metric.content_length} characters
                      </span>
                      <span className="text-xs text-gray-500">
                        {metric.micro_modules?.estimated_duration_minutes || 3} min
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {metric.has_introduction && (
                      <Badge variant="outline" className="text-xs">Intro</Badge>
                    )}
                    {metric.has_examples && (
                      <Badge variant="outline" className="text-xs">Examples</Badge>
                    )}
                    {metric.has_quiz && (
                      <Badge variant="outline" className="text-xs">Quiz</Badge>
                    )}
                  </div>
                </div>
                
                <Progress 
                  value={metric.quality_score} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {stats.improvements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Recommended Improvements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stats.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Excellent Quality!</h3>
                <p className="text-gray-600">
                  Your course content meets all quality standards.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}