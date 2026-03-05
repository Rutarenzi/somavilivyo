
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UniversalSidebar } from './UniversalSidebar';
import { LearningHeader } from './LearningHeader';
import { LearningContentArea } from './LearningContentArea';
import { LearningFooter } from './LearningFooter';
import { useToast } from '@/hooks/use-toast';

interface Module {
  id: string;
  title: string;
  content: string;
  confirmationQuestion?: any;
  completed: boolean;
  locked: boolean;
}

interface Subtopic {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics: Subtopic[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
}

interface EnhancedLearningInterfaceProps {
  course: Course;
  onComplete: () => void;
}

export function EnhancedLearningInterface({ course, onComplete }: EnhancedLearningInterfaceProps) {
  const [currentModuleId, setCurrentModuleId] = useState<string>('');
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Find the first unlocked module on mount
  useEffect(() => {
    const firstModule = course.topics[0]?.subtopics[0]?.modules[0];
    if (firstModule && !firstModule.locked) {
      setCurrentModuleId(firstModule.id);
    }
  }, [course]);

  // Get current module and navigation info
  const getCurrentModuleInfo = () => {
    let currentModule: Module | null = null;
    let currentIndex = -1;
    let totalModules = 0;
    
    for (const topic of course.topics) {
      for (const subtopic of topic.subtopics) {
        for (const module of subtopic.modules) {
          if (module.id === currentModuleId) {
            currentModule = module;
            currentIndex = totalModules;
          }
          totalModules++;
        }
      }
    }
    
    return { currentModule, currentIndex, totalModules };
  };

  const getAllModules = (): Module[] => {
    const modules: Module[] = [];
    for (const topic of course.topics) {
      for (const subtopic of topic.subtopics) {
        modules.push(...subtopic.modules);
      }
    }
    return modules;
  };

  const { currentModule, currentIndex, totalModules } = getCurrentModuleInfo();
  const allModules = getAllModules();
  const progressPercentage = Math.round((completedModules.size / totalModules) * 100);

  const handleModuleSelect = (moduleId: string) => {
    const module = allModules.find(m => m.id === moduleId);
    if (module && !module.locked) {
      setCurrentModuleId(moduleId);
      // Close sidebar on mobile after selection
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const handleQuizComplete = (score: number) => {
    if (!currentModule) return;
    
    const newCompleted = new Set(completedModules);
    newCompleted.add(currentModule.id);
    setCompletedModules(newCompleted);
    
    // Unlock next module
    const nextModuleIndex = currentIndex + 1;
    if (nextModuleIndex < allModules.length) {
      const nextModule = allModules[nextModuleIndex];
      // Update module state to unlock it (this would typically be handled by state management)
    }
    
    toast({
      title: "Module Completed! 🎉",
      description: `Great job! You scored ${score}% on the knowledge check.`,
    });
  };

  const goToNextModule = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < allModules.length) {
      const nextModule = allModules[nextIndex];
      if (!nextModule.locked) {
        setCurrentModuleId(nextModule.id);
      }
    }
  };

  const goToPreviousModule = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentModuleId(allModules[prevIndex].id);
    }
  };

  const handleRestart = () => {
    // Reset any local state if needed
    const firstModule = course.topics[0]?.subtopics[0]?.modules[0];
    if (firstModule) {
      setCurrentModuleId(firstModule.id);
    }
  };

  if (!currentModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Course Complete! 🎉</h2>
          <p className="text-sm md:text-base text-gray-600">You've completed all modules in this course.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Universal Sidebar - Mobile Optimized */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
          w-full sm:w-80 lg:w-1/4 lg:min-w-[300px] lg:max-w-[400px]
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300 ease-in-out lg:transition-none
          bg-white lg:bg-transparent
          max-h-screen overflow-hidden
        `}>
          <UniversalSidebar
            topics={course.topics.map(topic => ({
              ...topic,
              subtopics: topic.subtopics.map(subtopic => ({
                ...subtopic,
                modules: subtopic.modules.map(module => ({
                  ...module,
                  completed: completedModules.has(module.id),
                  quiz: module.confirmationQuestion
                }))
              }))
            }))}
            currentModuleId={currentModuleId}
            onModuleSelect={handleModuleSelect}
            progressPercentage={progressPercentage}
            completedCount={completedModules.size}
            totalCount={totalModules}
            courseTitle={course.title}
          />
        </div>

        {/* Main Content Area - Mobile First */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-screen w-full">
          <LearningHeader
            currentModuleNumber={currentIndex + 1}
            totalModules={totalModules}
            moduleTitle={currentModule.title}
            progressPercentage={progressPercentage}
            onBack={() => navigate(-1)}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Content Area - Responsive */}
          <div className="flex-1 overflow-y-auto w-full">
            <LearningContentArea
              module={currentModule}
              onQuizComplete={handleQuizComplete}
              onNext={goToNextModule}
              isCompleted={completedModules.has(currentModule.id)}
            />
          </div>

          <LearningFooter
            onPrevious={goToPreviousModule}
            onNext={goToNextModule}
            onRestart={handleRestart}
            isPreviousDisabled={currentIndex === 0}
            isNextDisabled={currentIndex === allModules.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
