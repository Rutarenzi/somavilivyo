import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Search, ChevronDown, ChevronRight, BookOpen, Filter, Eye, AlertTriangle } from "lucide-react";
import { Course } from "@/hooks/useCourses";
import { MicroModule } from "@/hooks/useMicroModules";

interface SubtopicSelection {
  subtopicIndex: number;
  title: string;
  modules: MicroModule[];
  selectedModules: string[];
}

interface TopicSelection {
  topicIndex: number;
  title: string;
  subtopics: SubtopicSelection[];
  expanded: boolean;
}

interface EnhancedContentSelectionProps {
  courses: Course[];
  selectedCourse: Course | null;
  microModules: MicroModule[];
  selectedModuleIds: string[];
  coursesLoading: boolean;
  modulesLoading: boolean;
  onCourseSelect: (course: Course | null) => void;
  onModuleSelectionChange: (moduleIds: string[]) => void;
  error?: string | null; // Add error prop
}

export const EnhancedContentSelection: React.FC<EnhancedContentSelectionProps> = ({
  courses,
  selectedCourse,
  microModules,
  selectedModuleIds,
  coursesLoading,
  modulesLoading,
  onCourseSelect,
  onModuleSelectionChange,
  error
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopics, setExpandedTopics] = useState<number[]>([]);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Organize modules by topic and subtopic
  const organizedContent = useMemo(() => {
    if (!selectedCourse || !microModules.length) return [];

    const topicMap: { [key: number]: TopicSelection } = {};

    microModules.forEach(module => {
      const topicIndex = module.topic_index;
      const subtopicIndex = module.subtopic_index;

      if (!topicMap[topicIndex]) {
        const topicTitle = selectedCourse.topics?.[topicIndex]?.title || `Topic ${topicIndex + 1}`;
        topicMap[topicIndex] = {
          topicIndex,
          title: topicTitle,
          subtopics: [],
          expanded: expandedTopics.includes(topicIndex)
        };
      }

      let subtopic = topicMap[topicIndex].subtopics.find(s => s.subtopicIndex === subtopicIndex);
      if (!subtopic) {
        const subtopicTitle = selectedCourse.topics?.[topicIndex]?.subtopics?.[subtopicIndex]?.title || 
                              `Subtopic ${subtopicIndex + 1}`;
        subtopic = {
          subtopicIndex,
          title: subtopicTitle,
          modules: [],
          selectedModules: []
        };
        topicMap[topicIndex].subtopics.push(subtopic);
      }

      subtopic.modules.push(module);
      if (selectedModuleIds.includes(module.id)) {
        subtopic.selectedModules.push(module.id);
      }
    });

    return Object.values(topicMap).sort((a, b) => a.topicIndex - b.topicIndex);
  }, [selectedCourse, microModules, selectedModuleIds, expandedTopics]);

  // Filter modules based on search and difficulty
  const filteredModules = useMemo(() => {
    let filtered = microModules;

    if (searchQuery) {
      filtered = filtered.filter(module =>
        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.learning_objective?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterDifficulty !== 'all') {
      // Add difficulty filtering logic here when difficulty data is available
    }

    return filtered;
  }, [microModules, searchQuery, filterDifficulty]);

  const toggleTopicExpansion = (topicIndex: number) => {
    setExpandedTopics(prev =>
      prev.includes(topicIndex)
        ? prev.filter(t => t !== topicIndex)
        : [...prev, topicIndex]
    );
  };

  const toggleModule = (moduleId: string) => {
    const newSelection = selectedModuleIds.includes(moduleId)
      ? selectedModuleIds.filter(id => id !== moduleId)
      : [...selectedModuleIds, moduleId];
    onModuleSelectionChange(newSelection);
  };

  const toggleSubtopic = (subtopic: SubtopicSelection) => {
    const allModuleIds = subtopic.modules.map(m => m.id);
    const allSelected = allModuleIds.every(id => selectedModuleIds.includes(id));
    
    if (allSelected) {
      // Deselect all
      onModuleSelectionChange(selectedModuleIds.filter(id => !allModuleIds.includes(id)));
    } else {
      // Select all
      const newSelection = [...new Set([...selectedModuleIds, ...allModuleIds])];
      onModuleSelectionChange(newSelection);
    }
  };

  const toggleTopicSelection = (topic: TopicSelection) => {
    const allModuleIds = topic.subtopics.flatMap(s => s.modules.map(m => m.id));
    const allSelected = allModuleIds.every(id => selectedModuleIds.includes(id));
    
    if (allSelected) {
      // Deselect all
      onModuleSelectionChange(selectedModuleIds.filter(id => !allModuleIds.includes(id)));
    } else {
      // Select all
      const newSelection = [...new Set([...selectedModuleIds, ...allModuleIds])];
      onModuleSelectionChange(newSelection);
    }
  };

  const getModuleDisplayTitle = (module: MicroModule): string => {
    const isGenericTitle = /^Module \d+$/i.test(module.title.trim());
    if (isGenericTitle && module.learning_objective && module.learning_objective.trim() !== "") {
      return module.learning_objective;
    }
    return module.title;
  };

  const selectedCount = selectedModuleIds.length;
  const totalModules = microModules.length;

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          1. Select Content
        </CardTitle>
        <CardDescription>
          Choose a course and the modules to generate questions from.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Course Selection */}
        <div>
          <Label htmlFor="course-select">Course</Label>
          <Select 
            onValueChange={(value) => {
              const course = courses.find(c => c.id === value) || null;
              onCourseSelect(course);
            }}
            disabled={coursesLoading}
          >
            <SelectTrigger id="course-select">
            <SelectValue 
                placeholder={
                  coursesLoading 
                    ? "Loading courses..." 
                    : courses.length === 0 && error?.includes('timeout')
                    ? "Courses loading slowly - refresh page if needed"
                    : courses.length === 0 
                    ? "No courses available" 
                    : "Select a course"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></div>
                    <span className="text-sm text-muted-foreground">Loading courses...</span>
                  </div>
                </div>
              ) : courses.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <AlertTriangle className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No courses found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try creating a course first</p>
                  </div>
                </div>
              ) : (
                courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{course.title}</span>
                      <Badge variant="secondary" className="ml-2">
                        {course.difficulty_level}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedCourse && (
          <>
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-[120px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedCount} of {totalModules} modules selected
                </span>
              </div>
              <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
                {selectedCount * 10} questions
              </Badge>
            </div>

            {/* Module Selection */}
            <div>
              <Label>Content Structure</Label>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {modulesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">Loading modules...</div>
                  </div>
                ) : organizedContent.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center">
                    No modules found for this course.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {organizedContent.map((topic) => (
                      <Collapsible key={topic.topicIndex} open={expandedTopics.includes(topic.topicIndex)}>
                        <div className="space-y-1">
                          {/* Topic Header */}
                          <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={topic.subtopics.flatMap(s => s.modules.map(m => m.id)).every(id => selectedModuleIds.includes(id))}
                                onCheckedChange={() => toggleTopicSelection(topic)}
                              />
                              <CollapsibleTrigger 
                                className="flex items-center space-x-1 text-left"
                                onClick={() => toggleTopicExpansion(topic.topicIndex)}
                              >
                                {expandedTopics.includes(topic.topicIndex) ? 
                                  <ChevronDown className="h-4 w-4" /> : 
                                  <ChevronRight className="h-4 w-4" />
                                }
                                <span className="font-medium text-sm">{topic.title}</span>
                              </CollapsibleTrigger>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {topic.subtopics.reduce((acc, s) => acc + s.modules.length, 0)} modules
                            </Badge>
                          </div>

                          {/* Subtopics */}
                          <CollapsibleContent className="ml-6 space-y-1">
                            {topic.subtopics.map((subtopic) => (
                              <Collapsible key={subtopic.subtopicIndex}>
                                <div className="space-y-1">
                                  {/* Subtopic Header */}
                                  <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 border-l-2 border-muted">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        checked={subtopic.modules.every(m => selectedModuleIds.includes(m.id))}
                                        onCheckedChange={() => toggleSubtopic(subtopic)}
                                      />
                                      <span className="text-sm text-muted-foreground">{subtopic.title}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {subtopic.modules.length}
                                    </Badge>
                                  </div>

                                  {/* Modules */}
                                  <div className="ml-6 space-y-1">
                                    {subtopic.modules
                                      .filter(module => !searchQuery || 
                                        module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        module.learning_objective?.toLowerCase().includes(searchQuery.toLowerCase())
                                      )
                                      .map(module => (
                                        <div key={module.id} className="flex items-center space-x-2 p-2 rounded-sm hover:bg-muted/20">
                                          <Checkbox
                                            checked={selectedModuleIds.includes(module.id)}
                                            onCheckedChange={() => toggleModule(module.id)}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-xs font-medium truncate" title={getModuleDisplayTitle(module)}>
                                              {getModuleDisplayTitle(module)}
                                            </div>
                                            {module.estimated_duration_minutes && (
                                              <div className="text-xs text-muted-foreground">
                                                {module.estimated_duration_minutes} min
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </Collapsible>
                            ))}
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {searchQuery && filteredModules.length !== microModules.length && (
              <div className="text-xs text-muted-foreground">
                Showing {filteredModules.length} of {microModules.length} modules
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};