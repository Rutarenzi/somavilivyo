
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Lock,
  Play,
  Clock,
  Target,
  HelpCircle,
  Menu,
  X,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizInfo {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface ModuleInfo {
  id: string;
  title: string;
  completed: boolean;
  locked: boolean;
  quiz?: QuizInfo;
  estimatedMinutes?: number;
}

interface SubtopicInfo {
  id: string;
  title: string;
  description?: string;
  modules: ModuleInfo[];
}

interface TopicInfo {
  id: string;
  title: string;
  description?: string;
  subtopics: SubtopicInfo[];
}

interface UniversalSidebarProps {
  topics: TopicInfo[];
  currentModuleId?: string;
  onModuleSelect: (moduleId: string) => void;
  progressPercentage: number;
  completedCount: number;
  totalCount: number;
  courseTitle: string;
}

export function UniversalSidebar({
  topics,
  currentModuleId,
  onModuleSelect,
  progressPercentage,
  completedCount,
  totalCount,
  courseTitle
}: UniversalSidebarProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set([topics[0]?.id]));
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const toggleSubtopic = (subtopicId: string) => {
    const newExpanded = new Set(expandedSubtopics);
    if (newExpanded.has(subtopicId)) {
      newExpanded.delete(subtopicId);
    } else {
      newExpanded.add(subtopicId);
    }
    setExpandedSubtopics(newExpanded);
  };

  // Generate meaningful topic icons based on content
  const getTopicIcon = (title: string, index: number) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('fundamental') || titleLower.includes('basic') || titleLower.includes('intro')) return '🎯';
    if (titleLower.includes('advanced') || titleLower.includes('expert')) return '🚀';
    if (titleLower.includes('practical') || titleLower.includes('hands-on')) return '⚡';
    if (titleLower.includes('theory') || titleLower.includes('concept')) return '📚';
    if (titleLower.includes('project') || titleLower.includes('build')) return '🛠️';
    if (titleLower.includes('data') || titleLower.includes('analysis')) return '📊';
    if (titleLower.includes('web') || titleLower.includes('frontend')) return '🌐';
    if (titleLower.includes('backend') || titleLower.includes('server')) return '⚙️';
    if (titleLower.includes('machine learning') || titleLower.includes('ai')) return '🤖';
    if (titleLower.includes('design') || titleLower.includes('ui')) return '🎨';
    
    // Fallback to topic-specific icons
    const icons = ['🎯', '📚', '⚡', '🚀', '🛠️', '📊', '🌐', '⚙️'];
    return icons[index % icons.length];
  };

  const getSubtopicIcon = (title: string, parentTitle: string) => {
    const titleLower = title.toLowerCase();
    const parentLower = parentTitle.toLowerCase();
    
    if (titleLower.includes('setup') || titleLower.includes('install')) return '⚙️';
    if (titleLower.includes('example') || titleLower.includes('demo')) return '💡';
    if (titleLower.includes('practice') || titleLower.includes('exercise')) return '💪';
    if (titleLower.includes('test') || titleLower.includes('quiz')) return '✅';
    if (titleLower.includes('deploy') || titleLower.includes('publish')) return '🚀';
    
    // Inherit context from parent topic
    if (parentLower.includes('data')) return '📈';
    if (parentLower.includes('web')) return '🌍';
    if (parentLower.includes('mobile')) return '📱';
    
    return '📋';
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 shadow-lg flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="mb-4 hover:scale-110 transition-transform"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="text-xs text-gray-500 writing-mode-vertical rotate-180">
          {Math.round(progressPercentage)}%
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 shadow-xl flex flex-col">
      {/* Enhanced Header with Course Branding */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold truncate">{courseTitle}</h2>
              <p className="text-xs text-white/80 mt-1">Personalized Learning Journey</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="text-white hover:bg-white/20 hover:scale-110 transition-all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm opacity-90">
              <span>Learning Progress</span>
              <span className="font-bold">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-white/20" />
            <div className="flex items-center justify-between text-xs opacity-75">
              <span>{completedCount} of {totalCount} completed</span>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span>{Math.round((completedCount/totalCount)*100)}% mastery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation with Descriptive Names */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {topics.map((topic, topicIndex) => (
            <Collapsible
              key={topic.id}
              open={expandedTopics.has(topic.id)}
              onOpenChange={() => toggleTopic(topic.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm">
                      {getTopicIcon(topic.title, topicIndex)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-800 text-base leading-tight">{topic.title}</div>
                      <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {topic.subtopics.reduce((total, st) => total + st.modules.length, 0)} learning modules • 
                        Est. {Math.round(topic.subtopics.reduce((total, st) => total + st.modules.length, 0) * 15)} min
                      </div>
                      {topic.description && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-2">{topic.description}</div>
                      )}
                    </div>
                    {expandedTopics.has(topic.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="ml-4 space-y-2 animate-fade-in">
                {topic.subtopics.map((subtopic, subtopicIndex) => (
                  <Collapsible
                    key={subtopic.id}
                    open={expandedSubtopics.has(subtopic.id)}
                    onOpenChange={() => toggleSubtopic(subtopic.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-3 h-auto text-sm hover:bg-purple-50 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
                            {getSubtopicIcon(subtopic.title, topic.title)}
                          </div>
                          <div className="flex-1 text-left">
                            <span className="font-medium text-gray-700">{subtopic.title}</span>
                            {subtopic.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-1">{subtopic.description}</div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {subtopic.modules.length}
                          </Badge>
                          {expandedSubtopics.has(subtopic.id) ? (
                            <ChevronDown className="h-3 w-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="ml-8 space-y-1 animate-fade-in">
                      {subtopic.modules.map((module) => {
                        const isCurrent = currentModuleId === module.id;
                        
                        return (
                          <div key={module.id} className="group">
                            <Button
                              variant="ghost"
                              onClick={() => !module.locked && onModuleSelect(module.id)}
                              disabled={module.locked}
                              className={cn(
                                "w-full justify-start p-3 h-auto text-xs transition-all duration-200 rounded-lg",
                                isCurrent && "bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 shadow-sm",
                                module.completed && "bg-green-50 border border-green-200",
                                module.locked && "opacity-50 cursor-not-allowed",
                                !module.locked && !isCurrent && "hover:bg-gray-50 hover:scale-[1.02]"
                              )}
                            >
                              <div className="flex items-center gap-3 w-full">
                                {module.completed ? (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="h-3 w-3 text-white" />
                                  </div>
                                ) : module.locked ? (
                                  <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                ) : isCurrent ? (
                                  <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Play className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                                )}
                                <div className="flex-1 text-left">
                                  <div className={cn(
                                    "font-medium text-sm leading-tight",
                                    module.completed && "text-green-700",
                                    isCurrent && "text-indigo-700",
                                    module.locked && "text-gray-400"
                                  )}>
                                    {module.title}
                                  </div>
                                  {module.estimatedMinutes && (
                                    <div className="flex items-center gap-1 text-gray-500 mt-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{module.estimatedMinutes} min read</span>
                                    </div>
                                  )}
                                </div>
                                {module.quiz && (
                                  <HelpCircle className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                )}
                              </div>
                            </Button>
                            
                            {/* Enhanced Quiz Preview */}
                            {module.quiz && (
                              <div className="hidden group-hover:block ml-8 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs animate-fade-in">
                                <div className="flex items-center gap-2 mb-2">
                                  <HelpCircle className="h-3 w-3 text-blue-600" />
                                  <span className="font-medium text-blue-800">Knowledge Check:</span>
                                </div>
                                <div className="text-blue-700">{module.quiz.question}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>

      {/* Enhanced Footer Stats */}
      <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xl font-bold text-indigo-600">{topics.length}</div>
            <div className="text-xs text-gray-600">Learning Paths</div>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-gray-600">Mastered</div>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <div className="text-xl font-bold text-purple-600">{totalCount - completedCount}</div>
            <div className="text-xs text-gray-600">Upcoming</div>
          </div>
        </div>
      </div>
    </div>
  );
}
