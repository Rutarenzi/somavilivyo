
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronRight, Clock, Users, BookOpen } from "lucide-react";

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface UnitViewProps {
  unit: {
    id: string;
    title: string;
    description: string;
    topics: any[];
  };
  onNavigate: (state: NavigationState) => void;
}

export function UnitView({ unit, onNavigate }: UnitViewProps) {
  const calculateTopicProgress = (topic: any) => {
    let completed = 0;
    let total = 0;

    topic.subtopics.forEach((subtopic: any) => {
      subtopic.modules.forEach((module: any) => {
        total++;
        if (module.completed) completed++;
      });
    });

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getTopicStats = (topic: any) => {
    let totalModules = 0;
    let totalMinutes = 0;

    topic.subtopics.forEach((subtopic: any) => {
      subtopic.modules.forEach((module: any) => {
        totalModules++;
        totalMinutes += module.estimatedMinutes || 0;
      });
    });

    return { totalModules, totalMinutes };
  };

  const unitProgress = calculateTopicProgress({ subtopics: unit.topics.flatMap((t: any) => t.subtopics) });

  return (
    <div className="p-8 space-y-8">
      {/* Unit Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BookOpen className="h-4 w-4" />
          <span>Unit Overview</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900">{unit.title}</h1>
        <p className="text-xl text-gray-600 max-w-3xl">{unit.description}</p>
        
        {/* Unit Progress */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold">Unit Progress</span>
            <span className="text-2xl font-bold text-indigo-600">{unitProgress}%</span>
          </div>
          <Progress value={unitProgress} className="h-3" />
          <div className="text-sm text-gray-600 mt-2">
            {unit.topics.length} topics • Complete all topics to master this unit
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid gap-6">
        <h2 className="text-2xl font-bold text-gray-900">Topics in this Unit</h2>
        
        {unit.topics.map((topic: any, index: number) => {
          const progress = calculateTopicProgress(topic);
          const { totalModules, totalMinutes } = getTopicStats(topic);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          const isCompleted = progress === 100;

          return (
            <Card 
              key={topic.id} 
              className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900 flex items-center space-x-2">
                        <span>{topic.title}</span>
                        {isCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{topic.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Topic {index + 1}
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

                {/* Topic Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{topic.subtopics.length} Sections</span>
                    </div>
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
                      view: 'topic', 
                      unitId: unit.id, 
                      topicId: topic.id 
                    })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCompleted ? 'Review' : 'Start'} Topic
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Subtopics Preview */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Learning sections:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {topic.subtopics.slice(0, 4).map((subtopic: any, subtopicIndex: number) => (
                      <div 
                        key={subtopic.id}
                        className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 truncate"
                      >
                        {subtopicIndex + 1}. {subtopic.title}
                      </div>
                    ))}
                    {topic.subtopics.length > 4 && (
                      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-2 text-center">
                        +{topic.subtopics.length - 4} more
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
