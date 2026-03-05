import React, { useState, useEffect, Suspense, lazy, memo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOptimizedCourseData } from "@/hooks/useOptimizedCourseData";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { parseContentAsync } from "@/utils/webWorkerParser";
import { performanceMonitor } from "@/utils/performance";
import { resourcePreloader, lazyLoadManager, performanceMetrics } from "@/utils/performanceOptimizer";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { ArrowLeft, BarChart3, Menu } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { MobileProgressTracker } from "./MobileProgressTracker";
import { useIsMobile } from "@/hooks/use-mobile";

// Aggressive lazy loading for non-critical components
const CourseHeroSection = lazy(() => import("./CourseHeroSection").then(m => ({ default: m.CourseHeroSection })));
const HierarchicalSidebar = lazy(() => import("./HierarchicalSidebar").then(m => ({ default: m.HierarchicalSidebar })));
const DynamicContentViews = lazy(() => import("./DynamicContentViews").then(m => ({ default: m.DynamicContentViews })));
const FloatingChatbot = lazy(() => import("./FloatingChatbot"));

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

// Memoized error boundary component
const ErrorFallback = memo(({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-3 xs:p-4">
    <div className="text-center space-y-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold text-gray-900">Oops! Something went wrong</h2>
      <p className="text-gray-600">{message}</p>
      <EnhancedButton onClick={onRetry} variant="gradient">
        Try Again
      </EnhancedButton>
    </div>
  </div>
));

// Optimized skeleton with better perceived performance
const OptimizedSkeleton = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 animate-pulse">
    <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300"></div>
    <div className="flex">
      <div className="w-1/4 p-4 space-y-4">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
));

export const OptimizedLearningInterface = memo(() => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Start performance measurement
  useEffect(() => {
    performanceMonitor.startMeasurement('learning-interface-load');
    return () => {
      performanceMonitor.endMeasurement('learning-interface-load');
    };
  }, []);

  const {
    course,
    microModules,
    userProgress,
    progressStats,
    loading,
    error,
    updateProgress,
    refetch
  } = useOptimizedCourseData(courseId || '');

  const [navigationState, setNavigationState] = useState<NavigationState>({ view: 'course' });
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Auto-open on desktop, closed on mobile

  // Memoized current module calculation
  const currentModule = React.useMemo(() => {
    return microModules[currentModuleIndex] || null;
  }, [microModules, currentModuleIndex]);

  // Optimized hierarchical data transformation with async parsing
  const [hierarchicalData, setHierarchicalData] = useState<any[]>([]);

  useEffect(() => {
    if (!course?.topics || !microModules.length) {
      setHierarchicalData([]);
      return;
    }

    const transformData = async () => {
      performanceMonitor.startMeasurement('data-transformation');
      
      const transformed = await Promise.all(
        course.topics.map(async (topic: any, topicIndex: number) => ({
          id: `topic-${topicIndex}`,
          title: topic.title || `Topic ${topicIndex + 1}`,
          description: topic.description || 'Comprehensive learning unit',
          topics: [{
            id: `topic-${topicIndex}`,
            title: topic.title || `Topic ${topicIndex + 1}`,
            description: topic.description || 'Explore key concepts',
            subtopics: await Promise.all(topic.subtopics?.map(async (subtopic: any, subtopicIndex: number) => {
              const relevantModules = microModules
                .filter(m => m.topic_index === topicIndex && m.subtopic_index === subtopicIndex)
                .sort((a, b) => (a.module_index || 0) - (b.module_index || 0));

                const modules = await Promise.all(relevantModules.map(async (microModule) => {
                const isCompleted = userProgress.some(p => 
                  p.micro_module_id === microModule.id && p.completed_at
                );

                // Use async parsing for better performance
                const parsedContent = await parseContentAsync(microModule.content, microModule.title);
                
                return {
                  id: microModule.id,
                  title: parsedContent.title || microModule.title,
                  content: microModule.content,
                  learning_objective: parsedContent.learningObjective || microModule.learning_objective,
                  quick_quiz: microModule.quick_quiz,
                  completed: isCompleted,
                  locked: false,
                  estimatedMinutes: microModule.estimated_duration_minutes || 3,
                  contentType: 'interactive',
                  generated_code: microModule.generated_code
                };
              }));

              return {
                id: `subtopic-${topicIndex}-${subtopicIndex}`,
                title: subtopic.title || `Learning Section ${subtopicIndex + 1}`,
                description: subtopic.description || 'Practical implementation',
                modules
              };
            }) || [])
          }]
        }))
      );

      setHierarchicalData(transformed);
      performanceMonitor.endMeasurement('data-transformation');
      performanceMetrics.recordMetric('hierarchical-data-transformation', performance.now());
    };

    transformData();
  }, [course?.topics, microModules, userProgress]);

  // Optimized navigation handler
  const handleNavigation = useCallback((state: NavigationState) => {
    setNavigationState(state);
    
    if (state.view === 'module' && state.moduleId) {
      const moduleIndex = microModules.findIndex(m => m.id === state.moduleId);
      if (moduleIndex >= 0) {
        setCurrentModuleIndex(moduleIndex);
      }
    }
    
    // Auto-close sidebar on mobile
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [microModules]);

  // Optimized resume learning
  const handleResumeLearning = useCallback(() => {
    if (currentModule) {
      setNavigationState({
        view: 'module',
        moduleId: currentModule.id
      });
    } else if (microModules.length > 0) {
      setCurrentModuleIndex(0);
      setNavigationState({
        view: 'module',
        moduleId: microModules[0].id
      });
    }
  }, [currentModule, microModules]);

  // Optimized quiz completion
  const handleQuizComplete = useCallback(async (score: number) => {
    if (!currentModule) return;
    
    // Optimistic update
    updateProgress(currentModule.id, true, score);
    
    // Navigate to next module after delay
    setTimeout(() => {
      if (currentModuleIndex < microModules.length - 1) {
        setCurrentModuleIndex(prev => prev + 1);
      } else {
        setNavigationState({ view: 'course' });
      }
    }, 1500);
  }, [currentModule, currentModuleIndex, microModules.length, updateProgress]);

  // Early returns for error states
  if (!courseId) {
    return (
      <ErrorFallback 
        message="No course ID provided" 
        onRetry={() => navigate('/courses')} 
      />
    );
  }

  if (error) {
    const isGenerationError = error.includes('being generated') || error.includes('no modules');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <ArrowLeft className="h-8 w-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {isGenerationError ? 'Course Still Generating' : 'Course Not Found'}
          </h2>
          <p className="text-gray-600">
            {isGenerationError 
              ? 'Your course content is still being created. This usually takes a few minutes. Please check back shortly.'
              : error
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <EnhancedButton onClick={refetch} variant="outline">
              Try Again
            </EnhancedButton>
            <EnhancedButton onClick={() => navigate('/courses')} variant="gradient">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </EnhancedButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <OptimizedSkeleton />;
  }

  if (!course) {
    return (
      <ErrorFallback 
        message="Course not found" 
        onRetry={() => navigate('/courses')} 
      />
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Learning interface error:', error);
      }}
    >
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        {/* Mobile Progress Tracker */}
        {isMobile && (
          <div className="lg:hidden">
            <MobileProgressTracker
              progressStats={progressStats}
              courseTitle={course?.title || ''}
              currentModule={currentModule ? {
                title: currentModule.title,
                estimatedMinutes: currentModule.estimated_duration_minutes || 3
              } : undefined}
              className="m-2 xs:m-3"
            />
          </div>
        )}

        {/* Desktop Progress Button */}
        {!isMobile && (
          <div className="fixed top-16 xs:top-20 right-2 xs:right-4 z-50">
            <EnhancedButton
              onClick={() => navigate(`/courses/${courseId}/progress`)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 xs:space-x-2 bg-white shadow-lg hover:shadow-xl transition-shadow text-xs xs:text-sm px-2 xs:px-3 py-1.5 xs:py-2"
            >
              <BarChart3 className="h-3 w-3 xs:h-4 w-4" />
              <span className="hidden xs:inline">Progress</span>
            </EnhancedButton>
          </div>
        )}

        {/* Hero Section - Skip on mobile to save space, lazy load on desktop */}
        {!isMobile && (
          <Suspense fallback={<div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>}>
            <ErrorBoundary>
              <CourseHeroSection
                course={{
                  title: course.title,
                  description: course.description,
                  difficulty_level: course.difficulty_level || "intermediate",
                  skill_area: course.skill_area || "General Learning"
                }}
                progressStats={progressStats}
                onResumeLearning={handleResumeLearning}
                estimatedTimeRemaining="2h 45m"
                averageQuizScore={progressStats.averageScore}
                badgesEarned={Math.floor(progressStats.completedModules / 3)}
              />
            </ErrorBoundary>
          </Suspense>
        )}

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar - Lazy loaded */}
          <div className={`
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
            w-full max-w-sm lg:w-1/4 lg:min-w-[280px] lg:max-w-[360px]
            transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            transition-transform duration-300 ease-in-out lg:transition-none
            bg-white lg:bg-transparent h-screen overflow-hidden
          `}>
            <Suspense fallback={
              <div className="p-4 space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            }>
              <ErrorBoundary>
                <HierarchicalSidebar
                  units={hierarchicalData}
                  currentState={navigationState}
                  onNavigate={handleNavigation}
                  progressStats={progressStats}
                  courseTitle={course.title}
                />
              </ErrorBoundary>
            </Suspense>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-screen bg-white w-full overflow-hidden">
            {/* Mobile Menu Button */}
            <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-2 xs:p-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 w-full touch-manipulation active:bg-gray-50 rounded-lg px-2 py-2 transition-colors"
              >
                <Menu className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="text-sm xs:text-base font-medium">Course Menu</span>
                {currentModule && (
                  <span className="text-xs text-gray-500 truncate ml-auto">
                    {currentModule.title}
                  </span>
                )}
              </button>
            </div>

            {/* Content Area */}
            <div className="w-full max-w-full overflow-x-hidden px-3 xs:px-4 sm:px-6">
              <Suspense fallback={
                <div className="p-6 space-y-6 animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              }>
                <ErrorBoundary>
                  <DynamicContentViews
                    navigationState={navigationState}
                    hierarchicalData={hierarchicalData}
                    currentModule={currentModule}
                    courseStylePreferences={course?.learning_preferences}
                    onNavigate={handleNavigation}
                    onQuizComplete={handleQuizComplete}
                    onNext={() => setCurrentModuleIndex(prev => Math.min(prev + 1, microModules.length - 1))}
                    onPrevious={() => setCurrentModuleIndex(prev => Math.max(prev - 1, 0))}
                    isCompleted={currentModule ? userProgress.some(p => 
                      p.micro_module_id === currentModule.id && p.completed_at
                    ) : false}
                  />
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
        </div>

        {/* Floating Chatbot - Lazy loaded */}
        <div className="fixed bottom-3 xs:bottom-4 left-3 xs:left-4 z-30">
          <Suspense fallback={null}>
            <ErrorBoundary>
              <FloatingChatbot courseContext={{
                title: course?.title,
                topics: course?.topics?.map((t: any) => t.title),
                currentModuleContent: currentModule?.title
              }} />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
});

OptimizedLearningInterface.displayName = 'OptimizedLearningInterface';