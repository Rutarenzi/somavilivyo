
import { CourseOverview } from "./CourseOverview";
import { UnitView } from "./UnitView";
import { TopicView } from "./TopicView";
import { SubtopicView } from "./SubtopicView";
import { ModuleView } from "./ModuleView";

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
  generated_code?: string;
}

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface DynamicContentViewsProps {
  navigationState: NavigationState;
  hierarchicalData: any[];
  currentModule?: Module;
  courseStylePreferences?: any;
  onNavigate: (state: NavigationState) => void;
  onQuizComplete: (score: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  isCompleted: boolean;
}

export function DynamicContentViews({
  navigationState,
  hierarchicalData,
  currentModule,
  courseStylePreferences,
  onNavigate,
  onQuizComplete,
  onNext,
  onPrevious,
  isCompleted
}: DynamicContentViewsProps) {
  const findDataByIds = () => {
    const unit = hierarchicalData.find(u => u.id === navigationState.unitId);
    const topic = unit?.topics.find((t: any) => t.id === navigationState.topicId);
    const subtopic = topic?.subtopics.find((s: any) => s.id === navigationState.subtopicId);
    
    return { unit, topic, subtopic };
  };

  const { unit, topic, subtopic } = findDataByIds();

  switch (navigationState.view) {
    case 'course':
      return (
        <CourseOverview 
          units={hierarchicalData}
          onNavigate={onNavigate}
        />
      );
    
    case 'unit':
      return unit ? (
        <UnitView 
          unit={unit}
          onNavigate={onNavigate}
        />
      ) : null;
    
    case 'topic':
      return topic ? (
        <TopicView 
          topic={topic}
          unitId={navigationState.unitId!}
          onNavigate={onNavigate}
        />
      ) : null;
    
    case 'subtopic':
      return subtopic ? (
        <SubtopicView 
          subtopic={subtopic}
          unitId={navigationState.unitId!}
          topicId={navigationState.topicId!}
          onNavigate={onNavigate}
        />
      ) : null;
    
    case 'module':
      return currentModule ? (
        <ModuleView 
          module={currentModule}
          unitTitle={unit?.title || ''}
          topicTitle={topic?.title || ''}
          subtopicTitle={subtopic?.title || ''}
          courseStylePreferences={courseStylePreferences}
          onNavigate={onNavigate}
          onQuizComplete={onQuizComplete}
          onNext={onNext}
          onPrevious={onPrevious}
          isCompleted={isCompleted}
        />
      ) : null;
    
    default:
      return (
        <CourseOverview 
          units={hierarchicalData}
          onNavigate={onNavigate}
        />
      );
  }
}
