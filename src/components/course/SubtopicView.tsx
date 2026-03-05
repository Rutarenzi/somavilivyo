
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Target, 
  BookOpen,
  Lock,
  ChevronRight 
} from "lucide-react";

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface SubtopicViewProps {
  subtopic: {
    id: string;
    title: string;
    description: string;
    modules: any[];
  };
  unitId: string;
  topicId: string;
  onNavigate: (state: NavigationState) => void;
}

export function SubtopicView({ subtopic, unitId, topicId, onNavigate }: SubtopicViewProps) {
  const calculateProgress = () => {
    const completed = subtopic.modules.filter(m => m.completed).length;
    return subtopic.modules.length > 0 ? Math.round((completed / subtopic.modules.length) * 100) : 0;
  };

  const getTotalTime = () => {
    return subtopic.modules.reduce((sum, module) => sum + (module.estimatedMinutes || 0), 0);
  };

  const progress = calculateProgress();
  const totalMinutes = getTotalTime();
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="p-8 space-y-8">
      {/* Subtopic Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <BookOpen className="h-4 w-4" />
          <span>Section Overview</span>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900">{subtopic.title}</h1>
        <p className="text-xl text-gray-600 max-w-3xl">{subtopic.description}</p>
        
        {/* Section Progress */}
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold">Section Progress</span>
            <span className="text-2xl font-bold text-purple-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          <div className="text-sm text-gray-600 mt-2 flex items-center justify-between">
            <span>{subtopic.modules.filter(m => m.completed).length} of {subtopic.modules.length} modules completed</span>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{hours > 0 ? `${hours}h ` : ''}{minutes}m total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Path */}
      <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          What You'll Learn
        </h3>
        <ul className="space-y-2 text-purple-800">
          <li>• Master the fundamental concepts through interactive content</li>
          <li>• Apply knowledge with hands-on exercises and real-world examples</li>
          <li>• Test understanding with knowledge checks and mini-quizzes</li>
          <li>• Build confidence through progressive skill development</li>
        </ul>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Learning Modules</h2>
        
        <div className="space-y-4">
          {subtopic.modules.map((module, index) => {
            const isCompleted = module.completed;
            const isLocked = module.locked;
            const canAccess = !isLocked;

            return (
              <Card 
                key={module.id} 
                className={`transition-all duration-300 ${
                  canAccess ? 'hover:shadow-lg cursor-pointer' : 'opacity-60'
                } ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}
                onClick={() => canAccess && onNavigate({ 
                  view: 'module', 
                  unitId,
                  topicId, 
                  subtopicId: subtopic.id, 
                  moduleId: module.id 
                })}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Status Icon */}
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                        {isLocked ? (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Lock className="h-6 w-6 text-gray-400" />
                          </div>
                        ) : isCompleted ? (
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <PlayCircle className="h-6 w-6 text-indigo-600" />
                          </div>
                        )}
                      </div>

                      {/* Module Info */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {module.title}
                          </h3>
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                            Module {index + 1}
                          </Badge>
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{module.estimatedMinutes} minutes</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="h-4 w-4" />
                            <span>{module.contentType}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center space-x-3">
                      {canAccess && (
                        <Button 
                          className={`${
                            isCompleted 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-indigo-600 hover:bg-indigo-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate({ 
                              view: 'module', 
                              unitId,
                              topicId, 
                              subtopicId: subtopic.id, 
                              moduleId: module.id 
                            });
                          }}
                        >
                          {isCompleted ? 'Review' : 'Start'}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
