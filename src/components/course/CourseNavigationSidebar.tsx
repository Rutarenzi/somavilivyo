
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Play, Lock, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Subtopic {
  title: string;
  description: string;
  objectives?: string[];
  exercises?: string[];
}

interface Topic {
  title: string;
  description: string;
  subtopics?: Subtopic[];
}

interface Course {
  id?: string;
  title: string;
  topics: Topic[];
}

interface CourseNavigationSidebarProps {
  course: Course;
  currentTopicIndex: number;
  currentSubtopicIndex: number;
  onNavigateToLesson: (topicIndex: number, subtopicIndex: number) => void;
  progress: number;
  onClose?: () => void;
}

export function CourseNavigationSidebar({
  course,
  currentTopicIndex,
  currentSubtopicIndex,
  onNavigateToLesson,
  progress,
  onClose
}: CourseNavigationSidebarProps) {
  const [collapsedTopics, setCollapsedTopics] = useState<Set<number>>(new Set());

  const toggleTopic = (topicIndex: number) => {
    const newCollapsed = new Set(collapsedTopics);
    if (newCollapsed.has(topicIndex)) {
      newCollapsed.delete(topicIndex);
    } else {
      newCollapsed.add(topicIndex);
    }
    setCollapsedTopics(newCollapsed);
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
    // First lesson is always accessible
    if (topicIndex === 0 && subtopicIndex === 0) return true;
    
    // Check if previous lesson is completed or current
    if (subtopicIndex > 0) {
      return isLessonCompleted(topicIndex, subtopicIndex - 1) || isLessonCurrent(topicIndex, subtopicIndex - 1);
    } else if (topicIndex > 0) {
      const prevTopic = course.topics[topicIndex - 1];
      const lastSubtopicIndex = (prevTopic?.subtopics?.length || 1) - 1;
      return isLessonCompleted(topicIndex - 1, lastSubtopicIndex) || isLessonCurrent(topicIndex - 1, lastSubtopicIndex);
    }
    
    return false;
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 xs:p-4 md:p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2 xs:mb-3">
          <h2 className="text-lg xs:text-xl font-bold text-gray-900 line-clamp-1">Course Navigation</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden p-1 xs:p-2"
            >
              <X className="h-4 w-4 xs:h-5 w-5" />
            </Button>
          )}
        </div>
        <div className="space-y-1 xs:space-y-2">
          <div className="flex justify-between text-xs xs:text-sm text-gray-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 xs:h-2" />
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-2 xs:p-3 md:p-4">
        <div className="space-y-2 xs:space-y-3 md:space-y-4">
          {course.topics?.map((topic, topicIndex) => {
            const isTopicCollapsed = collapsedTopics.has(topicIndex);
            
            return (
              <Card key={topicIndex} className="border border-gray-200">
                <CardHeader className="pb-2 xs:pb-3">
                  <CardTitle 
                    className="text-sm xs:text-base md:text-lg flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={() => toggleTopic(topicIndex)}
                  >
                    <div className="w-6 h-6 xs:w-7 xs:h-7 md:w-8 md:h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs xs:text-sm font-bold flex-shrink-0">
                      {topicIndex + 1}
                    </div>
                    <span className="flex-1 min-w-0 line-clamp-2">{topic.title}</span>
                    <div className="flex-shrink-0">
                      {isTopicCollapsed ? '▼' : '▲'}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {!isTopicCollapsed && (
                  <CardContent className="space-y-1 xs:space-y-2">
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
                            "w-full justify-start h-auto p-2 xs:p-3 text-left",
                            current && "bg-indigo-600 text-white",
                            !accessible && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (accessible) {
                              onNavigateToLesson(topicIndex, subtopicIndex);
                              onClose?.();
                            }
                          }}
                          disabled={!accessible}
                        >
                          <div className="flex items-start gap-2 xs:gap-3 w-full">
                            <div className="mt-0.5 flex-shrink-0">
                              {completed ? (
                                <CheckCircle className="h-3 w-3 xs:h-4 w-4 text-green-500" />
                              ) : current ? (
                                <Play className="h-3 w-3 xs:h-4 w-4" />
                              ) : accessible ? (
                                <Circle className="h-3 w-3 xs:h-4 w-4" />
                              ) : (
                                <Lock className="h-3 w-3 xs:h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs xs:text-sm line-clamp-2">
                                {subtopic.title}
                              </div>
                              <div className="text-xs opacity-75 mt-1 line-clamp-2">
                                {subtopic.description}
                              </div>
                              <div className="flex items-center gap-1 xs:gap-2 mt-1 xs:mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  <BookOpen className="h-2 w-2 xs:h-3 w-3 mr-0.5 xs:mr-1" />
                                  {subtopic.objectives?.length || 0} objectives
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
