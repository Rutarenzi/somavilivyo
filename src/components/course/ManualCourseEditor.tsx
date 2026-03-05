
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Save,
  BookOpen, 
  Target, 
  Clock,
  Edit3,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  topics: any[];
}

interface ManualCourseEditorProps {
  course: Course;
  onUpdate: (updatedCourse: Course) => void;
}

export function ManualCourseEditor({ course, onUpdate }: ManualCourseEditorProps) {
  const [editedCourse, setEditedCourse] = useState<Course>(course);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHasChanges(JSON.stringify(editedCourse) !== JSON.stringify(course));
  }, [editedCourse, course]);

  const handleSave = () => {
    onUpdate(editedCourse);
    toast({
      title: "Changes Saved",
      description: "Course has been updated successfully.",
    });
  };

  const updateBasicInfo = (field: string, value: string) => {
    setEditedCourse(prev => ({ ...prev, [field]: value }));
  };

  const addTopic = () => {
    const newTopic = {
      title: "New Topic",
      description: "Topic description",
      learningObjectives: ["Learning objective 1"],
      estimatedDuration: "1 hour",
      difficulty: "beginner",
      subtopics: []
    };

    setEditedCourse(prev => ({
      ...prev,
      topics: [...(prev.topics || []), newTopic]
    }));
  };

  const updateTopic = (topicIndex: number, field: string, value: any) => {
    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      updatedTopics[topicIndex] = {
        ...updatedTopics[topicIndex],
        [field]: value
      };
      return { ...prev, topics: updatedTopics };
    });
  };

  const deleteTopic = (topicIndex: number) => {
    setEditedCourse(prev => ({
      ...prev,
      topics: prev.topics.filter((_, index) => index !== topicIndex)
    }));
  };

  const addSubtopic = (topicIndex: number) => {
    const newSubtopic = {
      title: "New Subtopic",
      description: "Subtopic description",
      micro_modules: []
    };

    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      if (!updatedTopics[topicIndex].subtopics) {
        updatedTopics[topicIndex].subtopics = [];
      }
      updatedTopics[topicIndex].subtopics.push(newSubtopic);
      return { ...prev, topics: updatedTopics };
    });
  };

  const updateSubtopic = (topicIndex: number, subtopicIndex: number, field: string, value: any) => {
    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      updatedTopics[topicIndex].subtopics[subtopicIndex] = {
        ...updatedTopics[topicIndex].subtopics[subtopicIndex],
        [field]: value
      };
      return { ...prev, topics: updatedTopics };
    });
  };

  const deleteSubtopic = (topicIndex: number, subtopicIndex: number) => {
    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      updatedTopics[topicIndex].subtopics = updatedTopics[topicIndex].subtopics.filter(
        (_, index) => index !== subtopicIndex
      );
      return { ...prev, topics: updatedTopics };
    });
  };

  const addMicroModule = (topicIndex: number, subtopicIndex: number) => {
    const newModule = {
      title: "New Module",
      description: "Module description",
      content: "Module content goes here...",
      estimatedDuration: "15 minutes",
      difficulty: "beginner"
    };

    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      if (!updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules) {
        updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules = [];
      }
      updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules.push(newModule);
      return { ...prev, topics: updatedTopics };
    });
  };

  const updateMicroModule = (topicIndex: number, subtopicIndex: number, moduleIndex: number, field: string, value: any) => {
    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules[moduleIndex] = {
        ...updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules[moduleIndex],
        [field]: value
      };
      return { ...prev, topics: updatedTopics };
    });
  };

  const deleteMicroModule = (topicIndex: number, subtopicIndex: number, moduleIndex: number) => {
    setEditedCourse(prev => {
      const updatedTopics = [...(prev.topics || [])];
      updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules = 
        updatedTopics[topicIndex].subtopics[subtopicIndex].micro_modules.filter(
          (_, index) => index !== moduleIndex
        );
      return { ...prev, topics: updatedTopics };
    });
  };

  const updateLearningObjectives = (topicIndex: number, objectives: string) => {
    const objectiveArray = objectives.split('\n').filter(obj => obj.trim());
    updateTopic(topicIndex, 'learningObjectives', objectiveArray);
  };

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Edit3 className="h-6 w-6 mr-2" />
          Manual Course Editor
        </h2>
        <Button onClick={handleSave} disabled={!hasChanges} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {hasChanges && (
        <Badge variant="outline" className="text-orange-600 border-orange-300">
          Unsaved Changes
        </Badge>
      )}

      {/* Basic Course Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Course Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="course-title">Course Title</Label>
            <Input
              id="course-title"
              value={editedCourse.title}
              onChange={(e) => updateBasicInfo('title', e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="course-description">Description</Label>
            <Textarea
              id="course-description"
              value={editedCourse.description}
              onChange={(e) => updateBasicInfo('description', e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select 
                value={editedCourse.difficulty_level} 
                onValueChange={(value) => updateBasicInfo('difficulty_level', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input
                id="duration"
                value={editedCourse.estimated_duration}
                onChange={(e) => updateBasicInfo('estimated_duration', e.target.value)}
                placeholder="e.g., 2 hours"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Course Topics
            </CardTitle>
            <Button onClick={addTopic} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-4">
            {editedCourse.topics?.map((topic: any, topicIndex: number) => (
              <AccordionItem key={topicIndex} value={`topic-${topicIndex}`}>
                <Card>
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{topic.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTopic(topicIndex);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Topic Title</Label>
                          <Input
                            value={topic.title}
                            onChange={(e) => updateTopic(topicIndex, 'title', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={topic.description}
                            onChange={(e) => updateTopic(topicIndex, 'description', e.target.value)}
                            rows={3}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Learning Objectives (one per line)</Label>
                          <Textarea
                            value={topic.learningObjectives?.join('\n') || ''}
                            onChange={(e) => updateLearningObjectives(topicIndex, e.target.value)}
                            rows={3}
                            className="mt-1"
                            placeholder="Enter each learning objective on a new line"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Estimated Duration</Label>
                            <Input
                              value={topic.estimatedDuration || ''}
                              onChange={(e) => updateTopic(topicIndex, 'estimatedDuration', e.target.value)}
                              placeholder="e.g., 30 minutes"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Difficulty</Label>
                            <Select 
                              value={topic.difficulty || 'beginner'} 
                              onValueChange={(value) => updateTopic(topicIndex, 'difficulty', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Subtopics */}
                      <div className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Subtopics</h4>
                          <Button size="sm" onClick={() => addSubtopic(topicIndex)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subtopic
                          </Button>
                        </div>

                        {topic.subtopics?.map((subtopic: any, subtopicIndex: number) => (
                          <Card key={subtopicIndex} className="mb-4">
                            <CardContent className="pt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">Subtopic {subtopicIndex + 1}</h5>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSubtopic(topicIndex, subtopicIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div>
                                <Label>Subtopic Title</Label>
                                <Input
                                  value={subtopic.title}
                                  onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'title', e.target.value)}
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label>Description</Label>
                                <Textarea
                                  value={subtopic.description}
                                  onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'description', e.target.value)}
                                  rows={2}
                                  className="mt-1"
                                />
                              </div>

                              {/* Micro Modules */}
                              <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h6 className="font-medium text-sm">Micro Modules</h6>
                                  <Button size="sm" onClick={() => addMicroModule(topicIndex, subtopicIndex)}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Module
                                  </Button>
                                </div>

                                {subtopic.micro_modules?.map((module: any, moduleIndex: number) => (
                                  <Card key={moduleIndex} className="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-400">
                                    <CardContent className="pt-3 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-medium text-sm">Module {moduleIndex + 1}</span>
                                          <Badge variant="secondary" className="text-xs">
                                            Content Editable
                                          </Badge>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteMicroModule(topicIndex, subtopicIndex, moduleIndex)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>

                                      <div>
                                        <Label className="text-xs font-medium">Module Title</Label>
                                        <Input
                                          value={module.title}
                                          onChange={(e) => updateMicroModule(topicIndex, subtopicIndex, moduleIndex, 'title', e.target.value)}
                                          className="mt-1"
                                          placeholder="Enter module title..."
                                        />
                                      </div>

                                      <div>
                                        <Label className="text-xs font-medium">Learning Objective</Label>
                                        <Textarea
                                          value={module.description || module.learning_objective || ''}
                                          onChange={(e) => updateMicroModule(topicIndex, subtopicIndex, moduleIndex, 'description', e.target.value)}
                                          rows={2}
                                          className="mt-1"
                                          placeholder="What will students learn from this module?"
                                        />
                                      </div>

                                      <div className="border-t pt-3">
                                        <Label className="text-xs font-medium flex items-center">
                                          <Edit3 className="h-3 w-3 mr-1" />
                                          Module Content
                                        </Label>
                                        <Textarea
                                          value={module.content || ''}
                                          onChange={(e) => updateMicroModule(topicIndex, subtopicIndex, moduleIndex, 'content', e.target.value)}
                                          rows={8}
                                          className="mt-1 font-mono text-sm"
                                          placeholder="Enter the detailed module content here... 

Examples:
• Explanations and concepts
• Code examples
• Step-by-step instructions
• Diagrams or illustrations
• Interactive exercises
• Real-world applications"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                          This is the main content that students will see when studying this module.
                                        </p>
                                      </div>

                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs">Duration</Label>
                                          <Input
                                            value={module.estimatedDuration || ''}
                                            onChange={(e) => updateMicroModule(topicIndex, subtopicIndex, moduleIndex, 'estimatedDuration', e.target.value)}
                                            placeholder="15 minutes"
                                            className="mt-1"
                                          />
                                        </div>

                                        <div>
                                          <Label className="text-xs">Difficulty</Label>
                                          <Select 
                                            value={module.difficulty || 'beginner'} 
                                            onValueChange={(value) => updateMicroModule(topicIndex, subtopicIndex, moduleIndex, 'difficulty', value)}
                                          >
                                            <SelectTrigger className="mt-1">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="beginner">Beginner</SelectItem>
                                              <SelectItem value="intermediate">Intermediate</SelectItem>
                                              <SelectItem value="advanced">Advanced</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
