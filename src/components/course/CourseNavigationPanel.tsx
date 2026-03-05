
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle, 
  Circle, 
  Play, 
  Lock, 
  BookOpen, 
  Clock,
  Target,
  Trophy,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  title: string;
  description: string;
  subtopics: {
    title: string;
    description: string;
    objectives: string[];
    exercises: string[];
  }[];
}

interface Course {
  id?: string;
  title: string;
  topics: Topic[];
}

interface CourseNavigationPanelProps {
  course: Course;
  currentTopicIndex: number;
  currentSubtopicIndex: number;
  onNavigateToLesson: (topicIndex: number, subtopicIndex: number) => void;
  progress: number;
  timeSpent: number;
}

export function CourseNavigationPanel({
  course,
  currentTopicIndex,
  currentSubtopicIndex,
  onNavigateToLesson,
  progress,
  timeSpent
}: CourseNavigationPanelProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const isLessonCompleted = (topicIndex: number, subtopicIndex: number) => {
    const totalSubtopics = course.topics.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0);
    let lessonPosition = 0;

    for (let i = 0; i < topicIndex; i++) {
      lessonPosition += course.topics[i]?.subtopics?.length || 0;
    }
    lessonPosition += subtopicIndex;

    const completedLessons = Math.floor((progress / 100) * totalSubtopics);
    return lessonPosition < completedLessons;
  };

  const isLessonCurrent = (topicIndex: number, subtopicIndex: number) => {
    return topicIndex === currentTopicIndex && subtopicIndex === currentSubtopicIndex;
  };

  const isLessonAccessible = (topicIndex: number, subtopicIndex: number) => {
    if (topicIndex === 0 && subtopicIndex === 0) return true;
    
    if (subtopicIndex > 0) {
      return isLessonCompleted(topicIndex, subtopicIndex - 1) || isLessonCurrent(topicIndex, subtopicIndex - 1);
    } else if (topicIndex > 0) {
      const prevTopic = course.topics[topicIndex - 1];
      const lastSubtopicIndex = (prevTopic?.subtopics?.length || 1) - 1;
      return isLessonCompleted(topicIndex - 1, lastSubtopicIndex) || isLessonCurrent(topicIndex - 1, lastSubtopicIndex);
    }
    
    return false;
  };

  const getTopicProgress = (topicIndex: number) => {
    const topic = course.topics[topicIndex];
    if (!topic?.subtopics) return 0;
    
    let completed = 0;
    for (let i = 0; i < topic.subtopics.length; i++) {
      if (isLessonCompleted(topicIndex, i)) {
        completed++;
      }
    }
    return Math.round((completed / topic.subtopics.length) * 100);
  };

  return (
    <div className="h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Course Progress</h2>
            <p className="text-sm text-gray-600">Track your learning journey</p>
          </div>
        </div>
        
        {/* Progress Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{progress}%</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-600">{formatTime(timeSpent)}</div>
            <div className="text-xs text-gray-600">Studied</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Overall Progress</span>
            <span className="text-gray-600">{progress}%</span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-3 bg-gray-200" />
            <div 
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Course Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {course.topics?.map((topic, topicIndex) => {
            const topicProgress = getTopicProgress(topicIndex);
            const isCurrentTopic = topicIndex === currentTopicIndex;
            
            return (
              <Card 
                key={topicIndex} 
                className={cn(
                  "border transition-all duration-200",
                  isCurrentTopic 
                    ? "border-blue-200 bg-blue-50 shadow-md" 
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm",
                        isCurrentTopic 
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white" 
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {topicIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg leading-tight text-gray-900 mb-1">
                          {topic.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Topic Progress */}
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {topic.subtopics?.length || 0} lessons
                      </span>
                      <span className="font-medium text-gray-700">
                        {topicProgress}% complete
                      </span>
                    </div>
                    <Progress value={topicProgress} className="h-2" />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  {topic.subtopics?.map((subtopic, subtopicIndex) => {
                    const completed = isLessonCompleted(topicIndex, subtopicIndex);
                    const current = isLessonCurrent(topicIndex, subtopicIndex);
                    const accessible = isLessonAccessible(topicIndex, subtopicIndex);

                    return (
                      <Button
                        key={subtopicIndex}
                        variant={current ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start h-auto p-3 text-left transition-all duration-200",
                          current && "bg-blue-600 text-white shadow-md",
                          completed && !current && "bg-green-50 text-green-800 border-green-200",
                          !accessible && "opacity-50 cursor-not-allowed",
                          accessible && !current && !completed && "hover:bg-gray-50 hover:border-gray-200"
                        )}
                        onClick={() => accessible && onNavigateToLesson(topicIndex, subtopicIndex)}
                        disabled={!accessible}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="mt-0.5 flex-shrink-0">
                            {completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : current ? (
                              <Play className="h-4 w-4" />
                            ) : accessible ? (
                              <Circle className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate mb-1">
                              {subtopic.title}
                            </div>
                            <div className="text-xs opacity-75 line-clamp-2 mb-2">
                              {subtopic.description}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-xs",
                                  current && "bg-blue-100 text-blue-700",
                                  completed && "bg-green-100 text-green-700"
                                )}
                              >
                                <Target className="h-3 w-3 mr-1" />
                                {subtopic.objectives?.length || 0} goals
                              </Badge>
                              {completed && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Done
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span>Keep going! You're making great progress.</span>
          </div>
          <div className="text-xs text-gray-500">
            {course.topics?.length || 0} modules • {course.topics?.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0) || 0} total lessons
          </div>
        </div>
      </div>
    </div>
  );
}
