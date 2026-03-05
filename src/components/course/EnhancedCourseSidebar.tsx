
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown, BookOpen, PlayCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  topics: Topic[];
}

interface Topic {
  title: string;
  description?: string;
  subtopics: Subtopic[];
  estimatedDuration?: string;
}

interface Subtopic {
  title: string;
  description?: string;
  micro_modules: MicroModule[];
  estimatedDuration?: string;
}

interface MicroModule {
  title: string;
  description?: string;
  estimated_duration_minutes?: number;
  content?: string;
}

interface EnhancedCourseSidebarProps {
  course: Course;
  currentTopic: number;
  currentSubtopic: number;
  currentModule: number;
  onNavigate: (topicIndex: number, subtopicIndex: number, moduleIndex: number) => void;
  userProgress?: Record<string, boolean>;
}

export function EnhancedCourseSidebar({
  course,
  currentTopic,
  currentSubtopic,
  currentModule,
  onNavigate,
  userProgress = {}
}: EnhancedCourseSidebarProps) {
  const [expandedTopics, setExpandedTopics] = React.useState<Set<number>>(new Set([currentTopic]));
  const [expandedSubtopics, setExpandedSubtopics] = React.useState<Set<string>>(new Set([`${currentTopic}-${currentSubtopic}`]));

  const toggleTopic = (topicIndex: number) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicIndex)) {
      newExpanded.delete(topicIndex);
    } else {
      newExpanded.add(topicIndex);
    }
    setExpandedTopics(newExpanded);
  };

  const toggleSubtopic = (topicIndex: number, subtopicIndex: number) => {
    const key = `${topicIndex}-${subtopicIndex}`;
    const newExpanded = new Set(expandedSubtopics);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSubtopics(newExpanded);
  };

  const getModuleProgress = (topicIndex: number, subtopicIndex: number, moduleIndex: number) => {
    const key = `${topicIndex}-${subtopicIndex}-${moduleIndex}`;
    return userProgress[key] || false;
  };

  const getSubtopicProgress = (topicIndex: number, subtopicIndex: number, subtopic: Subtopic) => {
    const completedModules = subtopic.micro_modules.filter((_, moduleIndex) =>
      getModuleProgress(topicIndex, subtopicIndex, moduleIndex)
    ).length;
    return (completedModules / subtopic.micro_modules.length) * 100;
  };

  const getTopicProgress = (topicIndex: number, topic: Topic) => {
    let totalModules = 0;
    let completedModules = 0;
    
    topic.subtopics.forEach((subtopic, subtopicIndex) => {
      totalModules += subtopic.micro_modules.length;
      completedModules += subtopic.micro_modules.filter((_, moduleIndex) =>
        getModuleProgress(topicIndex, subtopicIndex, moduleIndex)
      ).length;
    });
    
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  };

  const getCourseProgress = () => {
    let totalModules = 0;
    let completedModules = 0;
    
    course.topics.forEach((topic, topicIndex) => {
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        totalModules += subtopic.micro_modules.length;
        completedModules += subtopic.micro_modules.filter((_, moduleIndex) =>
          getModuleProgress(topicIndex, subtopicIndex, moduleIndex)
        ).length;
      });
    });
    
    return totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Course Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="font-bold text-lg text-gray-900 mb-2">{course.title}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Course Progress</span>
            <span>{Math.round(getCourseProgress())}%</span>
          </div>
          <Progress value={getCourseProgress()} className="h-2" />
        </div>
      </div>

      {/* Course Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {course.topics.map((topic, topicIndex) => (
            <div key={topicIndex} className="space-y-1">
              {/* Topic Level */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start p-3 h-auto text-left",
                  currentTopic === topicIndex && "bg-blue-50 text-blue-700"
                )}
                onClick={() => toggleTopic(topicIndex)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    {expandedTopics.has(topicIndex) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <BookOpen className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{topic.title}</div>
                      {topic.estimatedDuration && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {topic.estimatedDuration}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500">
                      {Math.round(getTopicProgress(topicIndex, topic))}%
                    </div>
                    <Progress value={getTopicProgress(topicIndex, topic)} className="w-12 h-1" />
                  </div>
                </div>
              </Button>

              {/* Subtopics */}
              {expandedTopics.has(topicIndex) && (
                <div className="ml-6 space-y-1">
                  {topic.subtopics.map((subtopic, subtopicIndex) => (
                    <div key={subtopicIndex} className="space-y-1">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start p-2 h-auto text-left text-sm",
                          currentTopic === topicIndex && currentSubtopic === subtopicIndex && "bg-green-50 text-green-700"
                        )}
                        onClick={() => toggleSubtopic(topicIndex, subtopicIndex)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            {expandedSubtopics.has(`${topicIndex}-${subtopicIndex}`) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            <div className="text-left">
                              <div className="font-medium">{subtopic.title}</div>
                              {subtopic.estimatedDuration && (
                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {subtopic.estimatedDuration}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500">
                              {Math.round(getSubtopicProgress(topicIndex, subtopicIndex, subtopic))}%
                            </div>
                            <Progress value={getSubtopicProgress(topicIndex, subtopicIndex, subtopic)} className="w-10 h-1" />
                          </div>
                        </div>
                      </Button>

                      {/* Modules */}
                      {expandedSubtopics.has(`${topicIndex}-${subtopicIndex}`) && (
                        <div className="ml-6 space-y-1">
                          {subtopic.micro_modules.map((module, moduleIndex) => {
                            const isCompleted = getModuleProgress(topicIndex, subtopicIndex, moduleIndex);
                            const isCurrent = currentTopic === topicIndex && 
                                            currentSubtopic === subtopicIndex && 
                                            currentModule === moduleIndex;
                            
                            return (
                              <Button
                                key={moduleIndex}
                                variant="ghost"
                                className={cn(
                                  "w-full justify-start p-2 h-auto text-left text-xs",
                                  isCurrent && "bg-orange-50 text-orange-700 border border-orange-200",
                                  isCompleted && !isCurrent && "text-green-600"
                                )}
                                onClick={() => onNavigate(topicIndex, subtopicIndex, moduleIndex)}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-2">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <PlayCircle className="h-3 w-3" />
                                    )}
                                    <div className="text-left">
                                      <div className="font-medium">{module.title}</div>
                                      {module.estimated_duration_minutes && (
                                        <div className="text-xs text-gray-500 flex items-center mt-1">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {module.estimated_duration_minutes} min
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {isCurrent && (
                                    <Badge variant="secondary" className="text-xs">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
