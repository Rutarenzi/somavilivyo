
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  Target,
  Puzzle,
  Clock,
  CheckCircle2,
  PlayCircle,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  completed: boolean;
  locked: boolean;
  estimatedMinutes: number;
  contentType: string;
}

interface Subtopic {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

interface Topic {
  id: string;
  title: string;
  description: string;
  subtopics: Subtopic[];
}

interface Unit {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
}

interface NavigationState {
  view: 'course' | 'unit' | 'topic' | 'subtopic' | 'module';
  unitId?: string;
  topicId?: string;
  subtopicId?: string;
  moduleId?: string;
}

interface HierarchicalSidebarProps {
  units: Unit[];
  currentState: NavigationState;
  onNavigate: (state: NavigationState) => void;
  progressStats: {
    progressPercentage: number;
    completedModules: number;
    totalModules: number;
  };
  courseTitle: string;
}

export function HierarchicalSidebar({
  units,
  currentState,
  onNavigate,
  progressStats,
  courseTitle
}: HierarchicalSidebarProps) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set(['unit-0']));
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const calculateProgress = (items: any[], type: 'unit' | 'topic' | 'subtopic') => {
    let completed = 0;
    let total = 0;

    if (type === 'unit') {
      items.forEach((unit: Unit) => {
        unit.topics.forEach((topic: Topic) => {
          topic.subtopics.forEach((subtopic: Subtopic) => {
            subtopic.modules.forEach((module: Module) => {
              total++;
              if (module.completed) completed++;
            });
          });
        });
      });
    } else if (type === 'topic') {
      items.forEach((topic: Topic) => {
        topic.subtopics.forEach((subtopic: Subtopic) => {
          subtopic.modules.forEach((module: Module) => {
            total++;
            if (module.completed) completed++;
          });
        });
      });
    } else if (type === 'subtopic') {
      items.forEach((subtopic: Subtopic) => {
        subtopic.modules.forEach((module: Module) => {
          total++;
          if (module.completed) completed++;
        });
      });
    }

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const filteredUnits = units.filter(unit => 
    searchQuery === "" || 
    unit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.topics.some(topic => 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.subtopics.some(subtopic => 
        subtopic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subtopic.modules.some(module => 
          module.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    )
  );

  return (
    <div className="h-full bg-white border-r border-gray-200 overflow-hidden flex flex-col">
      {/* Mobile-Optimized Sidebar Header */}
      <div className="p-3 xs:p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-base xs:text-lg font-bold text-gray-900 mb-2 truncate">{courseTitle}</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-xs xs:text-sm text-gray-600">
            <span>Progress</span>
            <span className="font-semibold">{progressStats.progressPercentage}%</span>
          </div>
          <Progress value={progressStats.progressPercentage} className="h-1.5 xs:h-2" />
          <div className="text-xs text-gray-500 hidden xs:block">
            {progressStats.completedModules} of {progressStats.totalModules} modules completed
          </div>
          <div className="text-xs text-gray-500 xs:hidden">
            {progressStats.completedModules}/{progressStats.totalModules} done
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Search Bar */}
      <div className="p-2 xs:p-3 lg:p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 xs:h-4 xs:w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 xs:pl-10 pr-2 xs:pr-4 py-1.5 xs:py-2 text-xs xs:text-sm h-8 xs:h-auto"
          />
        </div>
      </div>

      {/* Mobile-Optimized Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-2 xs:p-3 lg:p-4 space-y-1 xs:space-y-2">
        {filteredUnits.map((unit) => {
          const unitProgress = calculateProgress([unit], 'unit');
          const isExpanded = expandedUnits.has(unit.id);
          const isActive = currentState.unitId === unit.id;

          return (
            <div key={unit.id} className="space-y-1">
              {/* Unit Level */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start p-2 xs:p-3 h-auto text-left hover:bg-indigo-50 touch-manipulation",
                  isActive && "bg-indigo-100 border border-indigo-200"
                )}
                onClick={() => {
                  toggleUnit(unit.id);
                  onNavigate({ view: 'unit', unitId: unit.id });
                }}
              >
                <div className="flex items-center space-x-1.5 xs:space-x-2 w-full">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 xs:h-4 xs:w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 xs:h-4 xs:w-4 text-gray-500 flex-shrink-0" />
                  )}
                  <BookOpen className="h-3 w-3 xs:h-4 xs:w-4 text-indigo-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs xs:text-sm text-gray-900 truncate">
                      {unit.title}
                    </div>
                    <div className="flex items-center space-x-1 xs:space-x-2 mt-1">
                      <Progress value={unitProgress} className="h-0.5 xs:h-1 flex-1" />
                      <span className="text-xs text-gray-500 flex-shrink-0">{unitProgress}%</span>
                    </div>
                  </div>
                </div>
              </Button>

              {/* Mobile-Optimized Topics under Unit */}
              {isExpanded && (
                <div className="ml-4 xs:ml-6 space-y-1">
                  {unit.topics.map((topic) => {
                    const topicProgress = calculateProgress([topic], 'topic');
                    const isTopicExpanded = expandedTopics.has(topic.id);
                    const isTopicActive = currentState.topicId === topic.id;

                    return (
                      <div key={topic.id} className="space-y-1">
                        {/* Topic Level */}
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start p-1.5 xs:p-2 h-auto text-left hover:bg-blue-50 touch-manipulation",
                            isTopicActive && "bg-blue-100 border border-blue-200"
                          )}
                          onClick={() => {
                            toggleTopic(topic.id);
                            onNavigate({ 
                              view: 'topic', 
                              unitId: unit.id, 
                              topicId: topic.id 
                            });
                          }}
                        >
                          <div className="flex items-center space-x-1 xs:space-x-2 w-full">
                            {isTopicExpanded ? (
                              <ChevronDown className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-gray-500 flex-shrink-0" />
                            )}
                            <Target className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-xs text-gray-800 truncate">
                                {topic.title}
                              </div>
                              <div className="flex items-center space-x-1 xs:space-x-2 mt-0.5 xs:mt-1">
                                <Progress value={topicProgress} className="h-0.5 xs:h-1 flex-1" />
                                <span className="text-xs text-gray-500 flex-shrink-0 hidden xs:inline">{topicProgress}%</span>
                                <span className="text-xs text-gray-500 flex-shrink-0 xs:hidden">{topicProgress}</span>
                              </div>
                            </div>
                          </div>
                        </Button>

                        {/* Mobile-Optimized Subtopics under Topic */}
                        {isTopicExpanded && (
                          <div className="ml-3 xs:ml-4 space-y-1">
                            {topic.subtopics.map((subtopic) => {
                              const subtopicProgress = calculateProgress([subtopic], 'subtopic');
                              const isSubtopicActive = currentState.subtopicId === subtopic.id;

                              return (
                                <div key={subtopic.id} className="space-y-1">
                                  {/* Subtopic Level */}
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start p-1.5 xs:p-2 h-auto text-left hover:bg-purple-50 touch-manipulation",
                                      isSubtopicActive && "bg-purple-100 border border-purple-200"
                                    )}
                                    onClick={() => onNavigate({ 
                                      view: 'subtopic', 
                                      unitId: unit.id, 
                                      topicId: topic.id, 
                                      subtopicId: subtopic.id 
                                    })}
                                  >
                                    <div className="flex items-center space-x-1 xs:space-x-2 w-full">
                                      <Puzzle className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-purple-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-xs text-gray-700 truncate">
                                          {subtopic.title}
                                        </div>
                                        <div className="flex items-center space-x-1 xs:space-x-2 mt-0.5 xs:mt-1">
                                          <Progress value={subtopicProgress} className="h-0.5 xs:h-1 flex-1" />
                                          <span className="text-xs text-gray-500 flex-shrink-0 hidden xs:inline">{subtopicProgress}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </Button>

                                  {/* Mobile-Optimized Modules under Subtopic */}
                                  <div className="ml-2 xs:ml-4 space-y-0.5 xs:space-y-1">
                                    {subtopic.modules.map((module) => {
                                      const isModuleActive = currentState.moduleId === module.id;

                                      return (
                                        <Button
                                          key={module.id}
                                          variant="ghost"
                                          className={cn(
                                            "w-full justify-start p-1 xs:p-2 h-auto text-left hover:bg-gray-50 touch-manipulation",
                                            isModuleActive && "bg-gray-100 border border-gray-300",
                                            module.locked && "opacity-50 cursor-not-allowed"
                                          )}
                                          onClick={() => !module.locked && onNavigate({ 
                                            view: 'module', 
                                            unitId: unit.id, 
                                            topicId: topic.id, 
                                            subtopicId: subtopic.id, 
                                            moduleId: module.id 
                                          })}
                                          disabled={module.locked}
                                        >
                                          <div className="flex items-center space-x-1 xs:space-x-2 w-full">
                                            {module.locked ? (
                                              <Lock className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-gray-400 flex-shrink-0" />
                                            ) : module.completed ? (
                                              <CheckCircle2 className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-green-600 flex-shrink-0" />
                                            ) : (
                                              <PlayCircle className="h-2.5 w-2.5 xs:h-3 xs:w-3 text-gray-600 flex-shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs text-gray-600 truncate">
                                                {module.title}
                                              </div>
                                              <div className="flex items-center space-x-1 xs:space-x-2 mt-0.5 xs:mt-1">
                                                <Clock className="h-2 w-2 text-gray-400 flex-shrink-0" />
                                                <span className="text-xs text-gray-400 flex-shrink-0">
                                                  {module.estimatedMinutes}m
                                                </span>
                                                {module.completed && (
                                                  <Badge variant="secondary" className="text-xs px-1 py-0 hidden xs:inline-flex">
                                                    ✓
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </Button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
