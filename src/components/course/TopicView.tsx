
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Puzzle, ChevronRight, Clock, Target, BookOpen } from "lucide-react";

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface TopicViewProps {
  topic: {
    id: string;
    title: string;
    description: string;
    subtopics: any[];
  };
  unitId: string;
  onNavigate: (state: NavigationState) => void;
}

export function TopicView({ topic, unitId, onNavigate }: TopicViewProps) {
  const calculateSubtopicProgress = (subtopic: any) => {
    let completed = 0;
    let total = subtopic.modules.length;

    subtopic.modules.forEach((module: any) => {
      if (module.completed) completed++;
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getSubtopicStats = (subtopic: any) => {
    const totalModules = subtopic.modules.length;
    const totalMinutes = subtopic.modules.reduce((sum: number, module: any) => 
      sum + (module.estimatedMinutes || 0), 0);
    
    return { totalModules, totalMinutes };
  };

  const topicProgress = calculateSubtopicProgress({ modules: topic.subtopics.flatMap((s: any) => s.modules) });

  return (
    <div className="p-8 space-y-8">
      {/* Topic Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BookOpen className="h-4 w-4" />
          <span>Topic Overview</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900">{topic.title}</h1>
        <p className="text-xl text-gray-600 max-w-3xl">{topic.description}</p>
        
        {/* Topic Progress */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold">Topic Progress</span>
            <span className="text-2xl font-bold text-blue-600">{topicProgress}%</span>
          </div>
          <Progress value={topicProgress} className="h-3" />
          <div className="text-sm text-gray-600 mt-2">
            {topic.subtopics.length} learning sections • Master each section to complete this topic
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Learning Objectives
        </h3>
        <ul className="space-y-2 text-blue-800">
          <li>• Understand the fundamental concepts and principles</li>
          <li>• Apply theoretical knowledge to practical scenarios</li>
          <li>• Develop critical thinking and analytical skills</li>
          <li>• Master advanced techniques and methodologies</li>
        </ul>
      </div>

      {/* Subtopics Grid */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold text-gray-900">Learning Sections</h2>
        
        {topic.subtopics.map((subtopic: any, index: number) => {
          const progress = calculateSubtopicProgress(subtopic);
          const { totalModules, totalMinutes } = getSubtopicStats(subtopic);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const isCompleted = progress === 100;

          return (
            <Card 
              key={subtopic.id} 
              className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Puzzle className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 flex items-center space-x-2">
                        <span>{subtopic.title}</span>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{subtopic.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    Section {index + 1}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Subtopic Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Target className="h-4 w-4" />
                      <span>{totalModules} Modules</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {hours > 0 ? `${hours}h ` : ''}{minutes}m
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => onNavigate({ 
                      view: 'subtopic', 
                      unitId: unitId,
                      topicId: topic.id, 
                      subtopicId: subtopic.id 
                    })}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isCompleted ? 'Review' : 'Start'} Section
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Modules Preview */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Modules in this section:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {subtopic.modules.slice(0, 3).map((module: any, moduleIndex: number) => (
                      <div 
                        key={module.id}
                        className={`text-sm p-2 rounded-lg flex items-center justify-between ${
                          module.completed 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <span className="truncate">
                          {moduleIndex + 1}. {module.title}
                        </span>
                        <div className="flex items-center space-x-2 ml-2">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{module.estimatedMinutes}m</span>
                        </div>
                      </div>
                    ))}
                    {subtopic.modules.length > 3 && (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2 text-center">
                        +{subtopic.modules.length - 3} more modules
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
