import React, { Suspense } from 'react';
import { EnhancedErrorBoundary } from '@/components/ui/enhanced-error-boundary';
import { useConsolidatedCourseData } from '@/hooks/useConsolidatedCourseData';
import { useOptimizedSubscriptions } from '@/hooks/useOptimizedSubscriptions';
import { useApiRequestManager } from '@/hooks/useApiRequestManager';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { MobileOptimizedCard } from '@/components/ui/mobile-optimized-card';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { DatabaseHealthMonitor } from '@/components/debug/DatabaseHealthMonitor';
import { BookOpen, Plus, TrendingUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBreakpoint } from '@/utils/responsiveUtils';

// Lazy loaded components for better performance
const CoursesGrid = React.lazy(() => import('@/components/course/ResponsiveCourseCard').then(module => ({ default: module.ResponsiveCourseCard })));
const ProgressChart = React.lazy(() => import('@/components/feedback/StudentProgressDashboard').then(module => ({ default: module.StudentProgressDashboard })));

export const OptimizedDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  
  const { 
    courses, 
    loading, 
    error, 
    refetch 
  } = useConsolidatedCourseData();

  const {
    makeRequest,
    getCacheStats,
    clearCache
  } = useApiRequestManager({
    cacheDuration: 10000, // 10 seconds for dashboard data
    maxConcurrentRequests: 5
  });

  // Set up optimized subscriptions for real-time updates
  useOptimizedSubscriptions({
    userId: user?.id || '',
    onCourseUpdate: (payload) => {
      console.log('[OptimizedDashboard] Course update received:', payload);
      refetch(); // Trigger data refresh
    },
    onProgressUpdate: (payload) => {
      console.log('[OptimizedDashboard] Progress update received:', payload);
      refetch(); // Trigger data refresh
    }
  });

  // Calculate dashboard statistics
  const dashboardStats = React.useMemo(() => {
    const totalCourses = courses.length;
    const ownedCourses = courses.filter(c => !c.is_shared).length;
    const sharedCourses = courses.filter(c => c.is_shared).length;
    const completedCourses = courses.filter(c => 
      c.progressStats && c.progressStats.progressPercentage === 100
    ).length;
    const averageProgress = courses.length > 0 
      ? Math.round(
          courses.reduce((sum, c) => 
            sum + (c.progressStats?.progressPercentage || 0), 0
          ) / courses.length
        )
      : 0;

    return {
      totalCourses,
      ownedCourses,
      sharedCourses,
      completedCourses,
      averageProgress
    };
  }, [courses]);

  if (error) {
    return (
      <ResponsiveContainer className="py-8">
        <EnhancedErrorBoundary
          componentName="OptimizedDashboard"
          level="critical"
          fallback={
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={refetch} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          }
        >
          <div />
        </EnhancedErrorBoundary>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer className="py-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Continue your learning journey or start a new course
          </p>
        </div>
        <Button 
          onClick={() => navigate('/create-course')}
          size={isMobile ? 'default' : 'lg'}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Stats Grid */}
      <ResponsiveGrid 
        columns={{ xs: 2, sm: 2, md: 4, lg: 4 }}
        gap={{ xs: 'gap-3', sm: 'gap-4' }}
      >
        <MobileOptimizedCard
          title="Total Courses"
          description={`${dashboardStats.ownedCourses} owned, ${dashboardStats.sharedCourses} shared`}
          className="text-center"
        >
          <div className="flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-blue-500 mr-2" />
            <span className="text-2xl font-bold">{dashboardStats.totalCourses}</span>
          </div>
        </MobileOptimizedCard>

        <MobileOptimizedCard
          title="Completed"
          description="Courses finished"
          className="text-center"
        >
          <div className="flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-green-500 mr-2" />
            <span className="text-2xl font-bold">{dashboardStats.completedCourses}</span>
          </div>
        </MobileOptimizedCard>

        <MobileOptimizedCard
          title="Average Progress"
          description="Across all courses"
          className="text-center"
        >
          <div className="flex items-center justify-center">
            <Clock className="h-8 w-8 text-orange-500 mr-2" />
            <span className="text-2xl font-bold">{dashboardStats.averageProgress}%</span>
          </div>
        </MobileOptimizedCard>

        <MobileOptimizedCard
          title="Active Learning"
          description="This week"
          className="text-center"
        >
          <div className="flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-purple-500 mr-2" />
            <span className="text-2xl font-bold">
              {courses.filter(c => c.progressStats && c.progressStats.progressPercentage > 0 && c.progressStats.progressPercentage < 100).length}
            </span>
          </div>
        </MobileOptimizedCard>
      </ResponsiveGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Courses</span>
                {courses.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/courses')}
                  >
                    View All
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg" />
                  ))}
                </div>
              }>
                <EnhancedErrorBoundary componentName="CoursesGrid" level="warning">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg" />
                      ))}
                    </div>
                  ) : courses.length > 0 ? (
                    <ResponsiveGrid columns={{ xs: 1, md: 2 }}>
                      {courses.slice(0, 4).map((course) => (
                        <CoursesGrid key={course.id} course={course} />
                      ))}
                    </ResponsiveGrid>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first course to get started
                      </p>
                      <Button onClick={() => navigate('/create-course')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Course
                      </Button>
                    </div>
                  )}
                </EnhancedErrorBoundary>
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Progress Overview */}
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
            <EnhancedErrorBoundary componentName="ProgressChart" level="info">
              {courses.length > 0 && (
                <ProgressChart courseId={courses[0].id} />
              )}
            </EnhancedErrorBoundary>
          </Suspense>

          {/* Performance Monitor */}
            <EnhancedErrorBoundary componentName="PerformanceMonitor" level="info">
              <PerformanceMonitor />
            </EnhancedErrorBoundary>

            {/* Database Health Monitor */}
            <EnhancedErrorBoundary componentName="DatabaseHealthMonitor" level="info">
              <DatabaseHealthMonitor />
            </EnhancedErrorBoundary>
        </div>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <strong>Cache Stats:</strong>
                <pre className="mt-1 bg-gray-100 p-2 rounded">
                  {JSON.stringify(getCacheStats(), null, 2)}
                </pre>
              </div>
              <div>
                <strong>Dashboard Stats:</strong>
                <pre className="mt-1 bg-gray-100 p-2 rounded">
                  {JSON.stringify(dashboardStats, null, 2)}
                </pre>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => clearCache()}
              className="mt-2"
            >
              Clear Cache
            </Button>
          </CardContent>
        </Card>
      )}
    </ResponsiveContainer>
  );
};