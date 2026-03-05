
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Clock, 
  Target,
  Star,
  ChevronRight,
  Video,
  FileText,
  Brain
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics: Subtopic[];
}

interface Subtopic {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  completed: boolean;
  locked: boolean;
  estimatedMinutes?: number;
  contentType?: 'text' | 'video' | 'interactive';
}

interface DynamicContentAreaProps {
  currentView: 'course' | 'topic' | 'subtopic' | 'module';
  selectedTopic?: Topic;
  selectedSubtopic?: Subtopic;
  selectedModule?: Module;
  topics: Topic[];
  onNavigate: (type: 'topic' | 'subtopic' | 'module', id: string) => void;
  progressData: {
    topicProgress: Record<string, number>;
    subtopicProgress: Record<string, number>;
  };
}

export function DynamicContentArea({
  currentView,
  selectedTopic,
  selectedSubtopic,
  selectedModule,
  topics,
  onNavigate,
  progressData
}: DynamicContentAreaProps) {
  const getContentTypeIcon = (type?: string) => {
    switch (type) {
      case 'video': return Video;
      case 'interactive': return Brain;
      default: return FileText;
    }
  };

  const getContentTypeColor = (type?: string) => {
    switch (type) {
      case 'video': return 'text-red-600 bg-red-100';
      case 'interactive': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  // Course Overview (All Topics)
  if (currentView === 'course') {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Course Overview</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Navigate through topics to access structured learning modules. Each topic builds upon previous concepts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, index) => {
            const progress = progressData.topicProgress[topic.id] || 0;
            const isCompleted = progress === 100;
            const isAccessible = index === 0 || progressData.topicProgress[topics[index - 1]?.id] >= 80;

            return (
              <Card 
                key={topic.id} 
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isAccessible ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => isAccessible && onNavigate('topic', topic.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                      isCompleted ? 'bg-green-500' : isAccessible ? 'bg-indigo-600' : 'bg-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="h-6 w-6" /> : index + 1}
                    </div>
                    <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                      {topic.subtopics.length} sections
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {topic.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <Button 
                    variant={isCompleted ? "outline" : "default"} 
                    size="sm" 
                    className="w-full mt-4"
                    disabled={!isAccessible}
                  >
                    {isCompleted ? 'Review' : isAccessible ? 'Start' : 'Locked'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Topic View (Subtopics)
  if (currentView === 'topic' && selectedTopic) {
    const topicProgress = progressData.topicProgress[selectedTopic.id] || 0;

    return (
      <div className="space-y-6">
        {/* Topic Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedTopic.title}</h2>
                <p className="text-gray-600 text-lg">{selectedTopic.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{topicProgress}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="flex-1">
              <Progress value={topicProgress} className="h-3" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedTopic.subtopics.length}</div>
              <div className="text-sm text-gray-600">Sections</div>
            </div>
          </div>
        </div>

        {/* Subtopics Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {selectedTopic.subtopics.map((subtopic, index) => {
            const progress = progressData.subtopicProgress[subtopic.id] || 0;
            const isCompleted = progress === 100;
            const isAccessible = index === 0 || progressData.subtopicProgress[selectedTopic.subtopics[index - 1]?.id] >= 100;

            return (
              <Card 
                key={subtopic.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isAccessible ? 'hover:scale-105' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => isAccessible && onNavigate('subtopic', subtopic.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                      Section {index + 1}
                    </Badge>
                    {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  <CardTitle className="text-xl">{subtopic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {subtopic.description}
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{subtopic.modules.length} modules</span>
                      <span>~{subtopic.modules.reduce((acc, m) => acc + (m.estimatedMinutes || 5), 0)} min</span>
                    </div>
                  </div>
                  <Button 
                    variant={isCompleted ? "outline" : "default"} 
                    size="sm" 
                    className="w-full mt-4"
                    disabled={!isAccessible}
                  >
                    {isCompleted ? 'Review' : isAccessible ? 'Start Section' : 'Locked'}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Subtopic View (Modules)
  if (currentView === 'subtopic' && selectedSubtopic) {
    const subtopicProgress = progressData.subtopicProgress[selectedSubtopic.id] || 0;

    return (
      <div className="space-y-6">
        {/* Subtopic Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-bold">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubtopic.title}</h2>
                <p className="text-gray-600 text-lg">{selectedSubtopic.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{subtopicProgress}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="flex-1">
              <Progress value={subtopicProgress} className="h-3" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{selectedSubtopic.modules.length}</div>
              <div className="text-sm text-gray-600">Modules</div>
            </div>
          </div>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {selectedSubtopic.modules.map((module, index) => {
            const ContentTypeIcon = getContentTypeIcon(module.contentType);
            const isAccessible = index === 0 || selectedSubtopic.modules[index - 1]?.completed;

            return (
              <Card 
                key={module.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                  isAccessible ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => isAccessible && onNavigate('module', module.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      module.completed 
                        ? 'bg-green-500 text-white' 
                        : isAccessible 
                          ? getContentTypeColor(module.contentType)
                          : 'bg-gray-200 text-gray-400'
                    }`}>
                      {module.completed ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <ContentTypeIcon className="h-6 w-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{module.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.estimatedMinutes || 5} min
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {module.contentType || 'text'}
                        </Badge>
                        {module.completed && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant={module.completed ? "outline" : "default"} 
                      size="sm"
                      disabled={!isAccessible}
                    >
                      {module.completed ? 'Review' : isAccessible ? 'Start' : 'Locked'}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
