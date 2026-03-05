import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Play, 
  Lock, 
  BookOpen,
  Target,
  Clock,
  Star,
  Search,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface Topic {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  locked: boolean;
  progress: number;
  subtopics: Subtopic[];
}

interface Subtopic {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  locked: boolean;
  progress: number;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  locked: boolean;
  current: boolean;
  estimatedMinutes?: number;
  contentType?: 'text' | 'video' | 'interactive' | 'audio';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface EnhancedSidebarProps {
  topics: Topic[];
  currentModuleId?: string;
  onModuleSelect: (moduleId: string) => void;
  onViewSelect?: (type: 'course' | 'topic' | 'subtopic', id?: string) => void;
  progressPercentage: number;
  completedCount: number;
  totalCount: number;
  courseTitle: string;
  progressData?: {
    topicProgress: Record<string, number>;
    subtopicProgress: Record<string, number>;
  };
}

const contentTypeIcons = {
  text: BookOpen,
  video: Play,
  interactive: Target,
  audio: Circle
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700'
};

export function EnhancedSidebar({
  topics,
  currentModuleId,
  onModuleSelect,
  onViewSelect,
  progressPercentage,
  completedCount,
  totalCount,
  courseTitle,
  progressData
}: EnhancedSidebarProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
      // Also collapse all subtopics under this topic
      topics.find(t => t.id === topicId)?.subtopics.forEach(st => {
        const newExpandedSubtopics = new Set(expandedSubtopics);
        newExpandedSubtopics.delete(st.id);
        setExpandedSubtopics(newExpandedSubtopics);
      });
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

  // Filter topics and modules based on search and completion status
  const filteredTopics = topics.filter(topic => {
    if (!showCompleted && topic.completed) return false;
    if (searchQuery) {
      const matchesSearch = 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.subtopics.some(st => 
          st.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          st.modules.some(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      return matchesSearch;
    }
    return true;
  });

  const getModuleIcon = (module: Module) => {
    if (module.completed) return CheckCircle;
    if (module.current) return Play;
    if (module.locked) return Lock;
    return Circle;
  };

  const getModuleIconColor = (module: Module) => {
    if (module.completed) return 'text-green-500';
    if (module.current) return 'text-blue-500';
    if (module.locked) return 'text-gray-400';
    return 'text-gray-300';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{courseTitle}</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{completedCount} of {totalCount} modules completed</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-yellow-600">Level {Math.floor(progressPercentage / 25) + 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-100 space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            {showCompleted ? 'Hide Completed' : 'Show All'}
          </Button>
          <Badge variant="secondary" className="text-xs">
            {filteredTopics.length} topics
          </Badge>
        </div>
      </div>

      {/* Navigation Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredTopics.map((topic) => (
            <Card key={topic.id} className="border border-gray-200 overflow-hidden">
              {/* Topic Header */}
              <div 
                className={cn(
                  "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                  expandedTopics.has(topic.id) && "border-b border-gray-100"
                )}
                onClick={() => toggleTopic(topic.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {expandedTopics.has(topic.id) ? 
                        <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" /> : 
                        <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      }
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                        topic.completed ? 'bg-green-500' : topic.locked ? 'bg-gray-400' : 'bg-indigo-600'
                      )}>
                        {topic.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          filteredTopics.indexOf(topic) + 1
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {topic.title}
                      </div>
                      {topic.description && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {topic.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {topic.subtopics.length}
                    </Badge>
                    <div className="w-16">
                      <Progress value={topic.progress} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subtopics */}
              {expandedTopics.has(topic.id) && (
                <div className="bg-gray-50/50">
                  {topic.subtopics.map((subtopic) => (
                    <div key={subtopic.id} className="border-b border-gray-100 last:border-b-0">
                      {/* Subtopic Header */}
                      <div 
                        className={cn(
                          "p-3 pl-8 cursor-pointer hover:bg-white/50 transition-colors",
                          expandedSubtopics.has(subtopic.id) && "border-b border-gray-100"
                        )}
                        onClick={() => toggleSubtopic(subtopic.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {expandedSubtopics.has(subtopic.id) ? 
                                <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" /> : 
                                <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0" />
                              }
                              <div className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0",
                                subtopic.completed ? 'bg-green-100 text-green-700' : 
                                subtopic.locked ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700'
                              )}>
                                {subtopic.completed ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  topic.subtopics.indexOf(subtopic) + 1
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {subtopic.title}
                              </div>
                              {subtopic.description && (
                                <div className="text-xs text-gray-500 truncate mt-1">
                                  {subtopic.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs">
                              {subtopic.modules.length}
                            </Badge>
                            <div className="w-12">
                              <Progress value={subtopic.progress} className="h-1" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Modules */}
                      {expandedSubtopics.has(subtopic.id) && (
                        <div className="bg-white/30">
                          {subtopic.modules.map((module) => {
                            const ModuleIcon = getModuleIcon(module);
                            const ContentTypeIcon = contentTypeIcons[module.contentType || 'text'];
                            
                            return (
                              <Button
                                key={module.id}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "w-full justify-start h-auto p-3 pl-12 text-left hover:bg-white/70",
                                  module.current && "bg-indigo-50 border-r-2 border-indigo-500 hover:bg-indigo-50",
                                  !module.locked && "cursor-pointer"
                                )}
                                onClick={() => !module.locked && onModuleSelect(module.id)}
                                disabled={module.locked}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <ModuleIcon className={cn("h-4 w-4 flex-shrink-0", getModuleIconColor(module))} />
                                  <div className="flex-1 min-w-0">
                                    <div className={cn(
                                      "font-medium text-sm truncate",
                                      module.current ? "text-indigo-900" : "text-gray-900",
                                      module.locked && "text-gray-400"
                                    )}>
                                      {module.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className="flex items-center gap-1">
                                        <ContentTypeIcon className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-500 capitalize">
                                          {module.contentType || 'text'}
                                        </span>
                                      </div>
                                      {module.estimatedMinutes && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-500">
                                            {module.estimatedMinutes}m
                                          </span>
                                        </div>
                                      )}
                                      {module.difficulty && (
                                        <Badge className={cn("text-xs py-0 px-1", difficultyColors[module.difficulty])}>
                                          {module.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  {module.completed && (
                                    <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" />
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
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Stats Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-indigo-600">{completedCount}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{totalCount - completedCount}</div>
            <div className="text-xs text-gray-600">Remaining</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{Math.floor(progressPercentage)}%</div>
            <div className="text-xs text-gray-600">Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
}
