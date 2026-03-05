
import { useState, useEffect } from "react";
import { EnhancedHeroSection } from "./EnhancedHeroSection";
import { EnhancedSidebar } from "./EnhancedSidebar";
import { DynamicContentArea } from "./DynamicContentArea";
import { LearningToolsPanel } from "./LearningToolsPanel";
import { LearningContentArea } from "./LearningContentArea";
import { useMicroModules } from "@/hooks/useMicroModules";

interface IdealCourseInterfaceProps {
  courseId: string;
}

export function IdealCourseInterface({ courseId }: IdealCourseInterfaceProps) {
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
  } = useMicroModules(courseId);

  const [currentView, setCurrentView] = useState<'course' | 'topic' | 'subtopic' | 'module'>('course');
  const [selectedTopicId, setSelectedTopicId] = useState<string>();
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>();
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const progressStats = getProgressStats();

  // Transform micro-modules into hierarchical structure
  const transformToHierarchicalData = () => {
    const topicsMap = new Map();
    
    microModules.forEach((module) => {
      const topicKey = `topic-${module.topic_index}`;
      const subtopicKey = `subtopic-${module.topic_index}-${module.subtopic_index}`;
      
      if (!topicsMap.has(topicKey)) {
        topicsMap.set(topicKey, {
          id: topicKey,
          title: `Strategic Foundations ${module.topic_index + 1}`,
          description: `Core concepts and practical applications for mastering essential business strategies.`,
          subtopics: new Map()
        });
      }
      
      const topic = topicsMap.get(topicKey);
      if (!topic.subtopics.has(subtopicKey)) {
        topic.subtopics.set(subtopicKey, {
          id: subtopicKey,
          title: `Implementation Framework ${module.subtopic_index + 1}`,
          description: `Hands-on learning for real-world application and skill development.`,
          modules: []
        });
      }
      
      const isCompleted = userProgress.some(p => p.micro_module_id === module.id && p.completed_at);
      const subtopic = topic.subtopics.get(subtopicKey);
      
      subtopic.modules.push({
        id: module.id,
        title: module.title,
        completed: isCompleted,
        locked: false,
        estimatedMinutes: module.estimated_duration_minutes,
        contentType: 'interactive'
      });
    });
    
    return Array.from(topicsMap.values()).map(topic => ({
      ...topic,
      subtopics: Array.from(topic.subtopics.values())
    }));
  };

  // Calculate progress data
  const calculateProgressData = (topics: any[]) => {
    const topicProgress: Record<string, number> = {};
    const subtopicProgress: Record<string, number> = {};

    topics.forEach(topic => {
      let topicCompleted = 0;
      let topicTotal = 0;

      topic.subtopics.forEach((subtopic: any) => {
        let subtopicCompleted = 0;
        subtopicCompleted = subtopic.modules.filter((m: any) => m.completed).length;
        
        subtopicProgress[subtopic.id] = subtopic.modules.length > 0 
          ? Math.round((subtopicCompleted / subtopic.modules.length) * 100)
          : 0;

        topicCompleted += subtopicCompleted;
        topicTotal += subtopic.modules.length;
      });

      topicProgress[topic.id] = topicTotal > 0 ? Math.round((topicCompleted / topicTotal) * 100) : 0;
    });

    return { topicProgress, subtopicProgress };
  };

  const topics = transformToHierarchicalData();
  const progressData = calculateProgressData(topics);

  const handleModuleSelect = (moduleId: string) => {
    const moduleIndex = microModules.findIndex(m => m.id === moduleId);
    if (moduleIndex >= 0) {
      jumpToModule(moduleIndex);
      setCurrentView('module');
    }
  };

  const handleViewSelect = (type: 'course' | 'topic' | 'subtopic', id?: string) => {
    setCurrentView(type);
    if (type === 'topic') {
      setSelectedTopicId(id);
      setSelectedSubtopicId(undefined);
    } else if (type === 'subtopic') {
      setSelectedSubtopicId(id);
    }
  };

  const handleQuizComplete = async (score: number) => {
    if (!currentModule) return;
    
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const success = await completeModule(currentModule.id, score, timeSpent);
    
    if (success) {
      // Auto-advance or show completion
      setTimeout(() => {
        if (currentModuleIndex < microModules.length - 1) {
          goToNextModule();
          setStartTime(Date.now());
        } else {
          setCurrentView('course');
        }
      }, 1500);
    }
  };

  const handleResumeLearning = () => {
    if (currentModule) {
      setCurrentView('module');
    } else if (microModules.length > 0) {
      jumpToModule(0);
      setCurrentView('module');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <div className="w-8 h-8 bg-indigo-600 rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading your enhanced learning experience...</p>
        </div>
      </div>
    );
  }

  const course = {
    title: "EduPerfect Business Strategy Mastery",
    description: "Master essential business frameworks and strategic decision-making through our revolutionary micro-learning approach.",
    difficulty_level: "intermediate",
    skill_area: "Business Strategy"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Hero Section - Always visible */}
      <EnhancedHeroSection
        course={course}
        progressStats={progressStats}
        onResumeLearning={handleResumeLearning}
        estimatedTimeRemaining="2h 45m"
        averageQuizScore={87}
        badgesEarned={Math.floor(progressStats.completedModules / 3)}
      />

      <div className="flex relative">
        {/* Enhanced Sidebar */}
        <EnhancedSidebar
          topics={topics}
          currentModuleId={currentModule?.id}
          onModuleSelect={handleModuleSelect}
          onViewSelect={handleViewSelect}
          progressPercentage={progressStats.progressPercentage}
          completedCount={progressStats.completedModules}
          totalCount={progressStats.totalModules}
          courseTitle="Business Strategy Mastery"
          progressData={progressData}
        />

        {/* Central Content Area */}
        <div className="flex-1 min-h-screen bg-white">
          {currentView === 'module' && currentModule ? (
            <LearningContentArea
              module={{
                id: currentModule.id,
                title: currentModule.title,
                content: currentModule.content,
                learning_objective: currentModule.learning_objective,
                confirmationQuestion: currentModule.quick_quiz
              }}
              onQuizComplete={handleQuizComplete}
              onNext={currentModuleIndex < microModules.length - 1 ? goToNextModule : undefined}
              isCompleted={userProgress.some(p => p.micro_module_id === currentModule.id && p.completed_at)}
            />
          ) : (
            <div className="p-8">
              <DynamicContentArea
                currentView={currentView}
                selectedTopic={topics.find(t => t.id === selectedTopicId)}
                selectedSubtopic={topics
                  .flatMap(t => t.subtopics)
                  .find(s => s.id === selectedSubtopicId)}
                topics={topics}
                onNavigate={(type, id) => {
                  if (type === 'module') {
                    handleModuleSelect(id);
                  } else {
                    handleViewSelect(type, id);
                  }
                }}
                progressData={progressData}
              />
            </div>
          )}
        </div>

        {/* Learning Tools Panel */}
        <LearningToolsPanel
          isOpen={toolsPanelOpen}
          onToggle={() => setToolsPanelOpen(!toolsPanelOpen)}
          courseId={courseId}
          courseTitle={course.title}
          currentModuleId={currentModule?.id}
          glossaryTerms={[
            { term: "SWOT Analysis", definition: "A strategic planning technique used to evaluate strengths, weaknesses, opportunities, and threats." },
            { term: "Value Proposition", definition: "A statement that clearly identifies what benefits a company provides and how it differs from competitors." },
            { term: "Market Segmentation", definition: "The process of dividing a market into distinct groups of consumers with different needs or characteristics." }
          ]}
        />
      </div>
    </div>
  );
}
