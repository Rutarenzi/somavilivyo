
import { useState, useEffect, Suspense, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCachedMicroModules } from "@/hooks/useCachedMicroModules";
import { useCachedCourses } from "@/hooks/useCachedCourses";
import { useCourseCompletion } from "@/hooks/useCourseCompletion";
import { CourseHeroSection } from "./CourseHeroSection";
import { CourseCompletionScreen } from "./CourseCompletionScreen";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { parseHTMLContent } from "@/utils/enhancedContentParser";
import FloatingChatbot from "./FloatingChatbot";
import { CourseContext } from "@/hooks/useChatbot";

// Lazy load heavy components for better performance
const HierarchicalSidebar = lazy(() => import("./HierarchicalSidebar").then(module => ({ default: module.HierarchicalSidebar })));
const DynamicContentViews = lazy(() => import("./DynamicContentViews").then(module => ({ default: module.DynamicContentViews })));
const ToolsPanel = lazy(() => import("./ToolsPanel").then(module => ({ default: module.ToolsPanel })));

type ViewType = 'course' | 'unit' | 'topic' | 'subtopic' | 'module';

interface NavigationState {
  view: ViewType;
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface Module {
  id: string;
  title: string;
  content: string;
  learning_objective: string;
  quick_quiz?: any;
  completed: boolean;
  locked: boolean;
  estimatedMinutes: number;
  contentType: string;
}

interface HierarchicalUnit {
  id: string;
  title: string;
  description: string;
  topics: HierarchicalTopic[];
}

interface HierarchicalTopic {
  id: string;
  title: string;
  description: string;
  subtopics: HierarchicalSubtopic[];
}

interface HierarchicalSubtopic {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

export function OptimizedMasterInterface() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses } = useCachedCourses();
  const {
    microModules,
    currentModule,
    currentModuleIndex,
    completeModule,
    goToNextModule,
    goToPreviousModule,
    jumpToModule,
    getProgressStats,
    loading,
    userProgress
  } = useCachedMicroModules(courseId || '');

  const [navigationState, setNavigationState] = useState<NavigationState>({
    view: 'course'
  });
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalUnit[]>([]);

  const course = courses.find(c => c.id === courseId);
  const progressStats = getProgressStats();

  // Check for course completion
  const { isCompleted, completionData } = useCourseCompletion({
    course: course ? {
      id: course.id,
      title: course.title,
      description: course.description || "",
      difficulty_level: course.difficulty_level,
      skill_area: course.skill_area
    } : null as any,
    microModules,
    userProgress
  });

  // Memoized transformation to avoid recalculating on every render
  useEffect(() => {
    if (!course?.topics || course.topics.length === 0 || microModules.length === 0) {
      return;
    }

    console.log(`📊 Transforming course structure: ${course.topics.length} topics, ${microModules.length} micro-modules (cached)`);

    const transformedData = course.topics.map((topic: any, topicIndex: number) => {
      const topicId = `topic-${topicIndex}`;
      
      const subtopics: HierarchicalSubtopic[] = topic.subtopics?.map((subtopic: any, subtopicIndex: number) => {
        const subtopicId = `subtopic-${topicIndex}-${subtopicIndex}`;
        
        const relevantMicroModules = microModules.filter(module => 
          module.topic_index === topicIndex && module.subtopic_index === subtopicIndex
        );

        const modules: Module[] = relevantMicroModules.map((microModule) => {
          const isCompleted = userProgress.some(p => p.micro_module_id === microModule.id && p.completed_at);
          const parsedContent = parseHTMLContent(microModule.content, microModule.title);
          
          return {
            id: microModule.id,
            title: parsedContent.title || microModule.title,
            content: microModule.content,
            learning_objective: parsedContent.learningObjective || microModule.learning_objective,
            quick_quiz: microModule.quick_quiz,
            completed: isCompleted,
            locked: false,
            estimatedMinutes: microModule.estimated_duration_minutes || 3,
            contentType: 'interactive'
          };
        });

        modules.sort((a, b) => {
          const moduleA = microModules.find(m => m.id === a.id);
          const moduleB = microModules.find(m => m.id === b.id);
          return (moduleA?.module_index || 0) - (moduleB?.module_index || 0);
        });

        return {
          id: subtopicId,
          title: subtopic.title || `Learning Section ${subtopicIndex + 1}`,
          description: subtopic.description || 'Practical implementation and real-world applications of key concepts.',
          modules: modules
        };
      }) || [];

      return {
        id: topicId,
        title: topic.title || `Topic ${topicIndex + 1}`,
        description: topic.description || 'Comprehensive learning unit covering essential concepts and practical applications.',
        topics: [{
          id: topicId,
          title: topic.title || `Topic ${topicIndex + 1}`,
          description: topic.description || 'Explore key concepts and practical applications in this topic area.',
          subtopics: subtopics
        }]
      };
    });

    setHierarchicalData(transformedData);
  }, [course?.topics, microModules, userProgress]);

  const handleNavigation = (state: NavigationState) => {
    setNavigationState(state);
    if (state.view === 'module' && state.moduleId) {
      const moduleIndex = microModules.findIndex(m => m.id === state.moduleId);
      if (moduleIndex >= 0) {
        jumpToModule(moduleIndex);
        setStartTime(Date.now());
      }
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleResumeLearning = () => {
    if (currentModule) {
      setNavigationState({
        view: 'module',
        moduleId: currentModule.id
      });
    } else if (microModules.length > 0) {
      jumpToModule(0);
      setNavigationState({
        view: 'module',
        moduleId: microModules[0].id
      });
    }
  };

  const handleQuizComplete = async (score: number) => {
    if (!currentModule) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const success = await completeModule(currentModule.id, score, timeSpent);
    
    if (success) {
      setTimeout(() => {
        if (currentModuleIndex < microModules.length - 1) {
          goToNextModule();
          setStartTime(Date.now());
        } else {
          setNavigationState({ view: 'course' });
        }
      }, 1500);
    }
  };

  const getCurrentModuleForDisplay = (): Module | undefined => {
    if (!currentModule) return undefined;
    
    const isCompleted = userProgress.some(p => p.micro_module_id === currentModule.id && p.completed_at);
    const parsedContent = parseHTMLContent(currentModule.content, currentModule.title);
    
    return {
      id: currentModule.id,
      title: parsedContent.title || currentModule.title,
      content: currentModule.content,
      learning_objective: parsedContent.learningObjective || currentModule.learning_objective,
      quick_quiz: currentModule.quick_quiz,
      completed: isCompleted,
      locked: false,
      estimatedMinutes: currentModule.estimated_duration_minutes,
      contentType: 'interactive'
    };
  };

  if (loading) {
    return <LoadingSpinner message="Loading your enhanced learning experience..." />;
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-3 xs:p-4">
        <div className="text-center space-y-3 xs:space-y-4 max-w-sm mx-auto">
          <h2 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900">Hang on for a minute.....course is loading😃😃😃😃😃</h2>
          <p className="text-sm xs:text-base text-gray-600">If the course takes long to appear, please reaload this page</p>
        </div>
      </div>
    );
  }

  if (hierarchicalData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-3 xs:p-4">
        <div className="text-center space-y-3 xs:space-y-4 max-w-sm mx-auto">
          <h2 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900">Course Structure Loading</h2>
          <p className="text-sm xs:text-base text-gray-600">Course modules are being prepared. Please refresh the page in a moment.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm xs:text-base"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const floatingChatbotContext: CourseContext = {
    title: course?.title,
    topics: course?.topics?.map((t: any) => t.title),
    currentModuleContent: currentModule?.title
  };

  // Show completion screen if course is completed
  if (isCompleted && completionData) {
    return (
      <CourseCompletionScreen
        data={completionData}
        onBackToCourses={() => navigate('/courses')}
        onShareCertificate={() => {
          // TODO: Implement certificate sharing
          console.log('Share certificate');
        }}
        onDownloadCertificate={() => {
          // TODO: Implement certificate download
          console.log('Download certificate');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 overflow-x-hidden">
      {/* Hero Section - Full Width */}
      <div className="w-full">
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
          averageQuizScore={87}
          badgesEarned={Math.floor(progressStats.completedModules / 3)}
        />
      </div>

      {/* Main Content Layout - Mobile First */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Mobile Responsive */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          w-full max-w-sm lg:w-1/4 lg:min-w-[280px] lg:max-w-[360px]
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300 ease-in-out lg:transition-none
          bg-white lg:bg-transparent
          h-screen overflow-hidden
        `}>
          <Suspense fallback={
            <div className="p-3 xs:p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          }>
            <HierarchicalSidebar
              units={hierarchicalData}
              currentState={navigationState}
              onNavigate={handleNavigation}
              progressStats={progressStats}
              courseTitle={course.title}
            />
          </Suspense>
        </div>

        {/* Main Content - Mobile Optimized */}
        <div className="flex-1 min-h-screen bg-white w-full overflow-hidden">
          {/* Mobile Menu Button */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 p-3 xs:p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 w-full"
            >
              <div className="w-4 h-4 xs:w-5 xs:h-5 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-current"></div>
                <div className="w-full h-0.5 bg-current"></div>
                <div className="w-full h-0.5 bg-current"></div>
              </div>
              <span className="text-sm xs:text-base font-medium">Course Menu</span>
            </button>
          </div>

          {/* Content Area - Responsive Padding */}
          <div className="w-full max-w-full overflow-x-hidden px-3 xs:px-4 sm:px-6">
            <Suspense fallback={
              <div className="p-4 xs:p-6 md:p-8 animate-pulse">
                <div className="h-6 xs:h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-24 xs:h-32 bg-gray-200 rounded"></div>
              </div>
            }>
              <DynamicContentViews
                navigationState={navigationState}
                hierarchicalData={hierarchicalData}
                currentModule={getCurrentModuleForDisplay()}
                onNavigate={handleNavigation}
                onQuizComplete={handleQuizComplete}
                onNext={goToNextModule}
                onPrevious={goToPreviousModule}
                isCompleted={currentModule ? userProgress.some(p => p.micro_module_id === currentModule.id && p.completed_at) : false}
              />
            </Suspense>
          </div>
        </div>

        {/* Tools Panel - Hidden on mobile, shown on desktop */}
        <div className="hidden xl:block w-1/5 min-w-[240px] max-w-[280px]">
          <Suspense fallback={
            <div className="p-3 xs:p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          }>
            <ToolsPanel
              isOpen={toolsPanelOpen}
              onToggle={() => setToolsPanelOpen(!toolsPanelOpen)}
              courseId={courseId || ''}
              courseTitle={course.title}
              currentModuleId={currentModule?.id}
              glossaryTerms={[
                { term: "Learning Objective", definition: "A specific, measurable goal that defines what you will know or be able to do after completing a module." },
                { term: "Micro-Module", definition: "A focused learning unit designed to be completed in 3-5 minutes, covering one specific concept or skill." },
                { term: "Knowledge Check", definition: "A quick quiz at the end of each module to reinforce learning and assess understanding." }
              ]}
            />
          </Suspense>
        </div>
      </div>
      
      {/* Floating Elements - Mobile Optimized Positioning */}
      <div className="fixed bottom-3 xs:bottom-4 left-3 xs:left-4 z-30">
        <FloatingChatbot courseContext={floatingChatbotContext} />
      </div>

      {/* Mobile Tools Panel Toggle */}
      <div className="xl:hidden fixed bottom-3 xs:bottom-4 right-3 xs:right-4 z-30">
        <button
          onClick={() => setToolsPanelOpen(!toolsPanelOpen)}
          className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 flex items-center justify-center"
        >
          <span className="text-base xs:text-lg sm:text-xl">📚</span>
        </button>
      </div>

      {/* Mobile Tools Panel Overlay */}
      {toolsPanelOpen && (
        <div className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white overflow-y-auto">
            <Suspense fallback={
              <div className="p-3 xs:p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            }>
              <ToolsPanel
                isOpen={toolsPanelOpen}
                onToggle={() => setToolsPanelOpen(!toolsPanelOpen)}
                courseId={courseId || ''}
                courseTitle={course.title}
                currentModuleId={currentModule?.id}
                glossaryTerms={[
                  { term: "Learning Objective", definition: "A specific, measurable goal that defines what you will know or be able to do after completing a module." },
                  { term: "Micro-Module", definition: "A focused learning unit designed to be completed in 3-5 minutes, covering one specific concept or skill." },
                  { term: "Knowledge Check", definition: "A quick quiz at the end of each module to reinforce learning and assess understanding." }
                ]}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
