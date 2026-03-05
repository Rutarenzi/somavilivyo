import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMicroModules } from "@/hooks/useMicroModules";
import { useCourses, Course } from "@/hooks/useCourses";
import { CourseHeroSection } from "./CourseHeroSection";
import { HierarchicalSidebar } from "./HierarchicalSidebar";
import { DynamicContentViews } from "./DynamicContentViews";
import { ToolsPanel } from "./ToolsPanel";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { parseHTMLContent } from "@/utils/enhancedContentParser";
import FloatingChatbot from "./FloatingChatbot";
import { CourseContext } from "@/hooks/useChatbot";

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

export function MasterCourseInterface() {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses } = useCourses();
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
  } = useMicroModules(courseId || '');

  const [navigationState, setNavigationState] = useState<NavigationState>({
    view: 'course'
  });
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const course = courses.find(c => c.id === courseId);
  const progressStats = getProgressStats();

  const transformToHierarchicalData = (): HierarchicalUnit[] => {
    if (!course?.topics || course.topics.length === 0) {
      console.log('No course topics found');
      return [];
    }

    console.log(`📊 Transforming course structure: ${course.topics.length} topics, ${microModules.length} micro-modules`);

    // Direct mapping: each topic becomes a unit with the actual topic name and structure
    return course.topics.map((topic: any, topicIndex: number) => {
      const topicId = `topic-${topicIndex}`;
      
      // Create subtopics from the actual course topic data
      const subtopics: HierarchicalSubtopic[] = topic.subtopics?.map((subtopic: any, subtopicIndex: number) => {
        const subtopicId = `subtopic-${topicIndex}-${subtopicIndex}`;
        
        // Find corresponding micro modules for this topic/subtopic combination
        const relevantMicroModules = microModules.filter(module => 
          module.topic_index === topicIndex && module.subtopic_index === subtopicIndex
        );

        console.log(`📍 Topic ${topicIndex}, Subtopic ${subtopicIndex}: Found ${relevantMicroModules.length} micro-modules`);

        // Create modules from micro_modules with their actual content
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

        // Sort modules by module_index
        modules.sort((a, b) => {
          const moduleA = microModules.find(m => m.id === a.id);
          const moduleB = microModules.find(m => m.id === b.id);
          return (moduleA?.module_index || 0) - (moduleB?.module_index || 0);
        });

        // If no micro-modules found but subtopic exists, create placeholder modules
        if (modules.length === 0 && subtopic.micro_modules && subtopic.micro_modules.length > 0) {
          console.log(`⚠️ Creating placeholder modules for subtopic ${subtopicIndex} from course data`);
          
          const placeholderModules = subtopic.micro_modules.map((moduleData: any, moduleIndex: number) => ({
            id: `placeholder-${topicIndex}-${subtopicIndex}-${moduleIndex}`,
            title: moduleData.title || `Module ${moduleIndex + 1}`,
            content: moduleData.content || 'Module content is being loaded...',
            learning_objective: moduleData.learning_objective || 'Learn key concepts',
            quick_quiz: moduleData.quick_quiz || {},
            completed: false,
            locked: false,
            estimatedMinutes: moduleData.estimated_duration_minutes || 5,
            contentType: 'interactive'
          }));
          
          modules.push(...placeholderModules);
        }

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
  };

  const hierarchicalData = transformToHierarchicalData();

  useEffect(() => {
    if (hierarchicalData.length > 0) {
      const totalModules = hierarchicalData.reduce((total, unit) => 
        total + unit.topics.reduce((topicTotal, topic) => 
          topicTotal + topic.subtopics.reduce((subtopicTotal, subtopic) => 
            subtopicTotal + subtopic.modules.length, 0), 0), 0);
      
      console.log(`📊 Hierarchical data structure: ${hierarchicalData.length} units, ${totalModules} total modules`);
    }
  }, [hierarchicalData]);

  const handleNavigation = (state: NavigationState) => {
    setNavigationState(state);
    if (state.view === 'module' && state.moduleId) {
      const moduleIndex = microModules.findIndex(m => m.id === state.moduleId);
      if (moduleIndex >= 0) {
        jumpToModule(moduleIndex);
        setStartTime(Date.now());
      }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Course Not Found</h2>
          <p className="text-gray-600">The course you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (hierarchicalData.length === 0 || hierarchicalData.every(unit => 
    unit.topics.every(topic => 
      topic.subtopics.every(subtopic => subtopic.modules.length === 0)))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Course Structure Loading</h2>
          <p className="text-gray-600">Course modules are being prepared. Please refresh the page in a moment.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
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

      <div className="flex relative">
        <div className="w-1/4 min-w-[300px] max-w-[400px]">
          <HierarchicalSidebar
            units={hierarchicalData}
            currentState={navigationState}
            onNavigate={handleNavigation}
            progressStats={progressStats}
            courseTitle={course.title}
          />
        </div>

        <div className="flex-1 min-h-screen bg-white">
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
        </div>

        <div className="w-1/5 min-w-[250px] max-w-[300px]">
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
        </div>
      </div>
      <FloatingChatbot courseContext={floatingChatbotContext} />
    </div>
  );
}
