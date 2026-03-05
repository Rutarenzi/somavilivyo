
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, GripVertical, BookOpen, FileText } from "lucide-react";

interface CustomTopic {
  title: string;
  description: string;
  subtopics: CustomSubtopic[];
}

interface CustomSubtopic {
  title: string;
  description: string;
  moduleCount: number;
}

interface CustomCourseStructureProps {
  customStructure: CustomTopic[];
  onStructureChange: (structure: CustomTopic[]) => void;
}

export function CustomCourseStructure({ customStructure, onStructureChange }: CustomCourseStructureProps) {
  const addTopic = () => {
    const newTopic: CustomTopic = {
      title: '',
      description: '',
      subtopics: [{
        title: '',
        description: '',
        moduleCount: 3
      }]
    };
    onStructureChange([...customStructure, newTopic]);
  };

  const removeTopic = (topicIndex: number) => {
    const newStructure = customStructure.filter((_, index) => index !== topicIndex);
    onStructureChange(newStructure);
  };

  const updateTopic = (topicIndex: number, field: keyof Omit<CustomTopic, 'subtopics'>, value: string) => {
    const newStructure = [...customStructure];
    newStructure[topicIndex] = {
      ...newStructure[topicIndex],
      [field]: value
    };
    onStructureChange(newStructure);
  };

  const addSubtopic = (topicIndex: number) => {
    const newSubtopic: CustomSubtopic = {
      title: '',
      description: '',
      moduleCount: 3
    };
    const newStructure = [...customStructure];
    newStructure[topicIndex].subtopics.push(newSubtopic);
    onStructureChange(newStructure);
  };

  const removeSubtopic = (topicIndex: number, subtopicIndex: number) => {
    const newStructure = [...customStructure];
    newStructure[topicIndex].subtopics = newStructure[topicIndex].subtopics.filter((_, index) => index !== subtopicIndex);
    onStructureChange(newStructure);
  };

  const updateSubtopic = (topicIndex: number, subtopicIndex: number, field: keyof CustomSubtopic, value: string | number) => {
    const newStructure = [...customStructure];
    newStructure[topicIndex].subtopics[subtopicIndex] = {
      ...newStructure[topicIndex].subtopics[subtopicIndex],
      [field]: value
    };
    onStructureChange(newStructure);
  };

  const getTotalModules = () => {
    return customStructure.reduce((total, topic) => 
      total + topic.subtopics.reduce((subtotal, subtopic) => subtotal + subtopic.moduleCount, 0), 0
    );
  };

  const getTotalSubtopics = () => {
    return customStructure.reduce((total, topic) => total + topic.subtopics.length, 0);
  };

  return (
    <div className="space-y-6">
      {/* Structure Overview */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="font-bold text-blue-900">{customStructure.length}</div>
            <div className="text-xs text-blue-600">Topics</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-900">{getTotalSubtopics()}</div>
            <div className="text-xs text-blue-600">Subtopics</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-900">{getTotalModules()}</div>
            <div className="text-xs text-blue-600">Total Modules</div>
          </div>
        </div>
        <Button onClick={addTopic} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Topic
        </Button>
      </div>

      {/* Topics */}
      <div className="space-y-6">
        {customStructure.map((topic, topicIndex) => (
          <Card key={topicIndex} className="border-2 border-gray-200">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Topic {topicIndex + 1}</CardTitle>
                </div>
                <Button
                  onClick={() => removeTopic(topicIndex)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Topic Title *</Label>
                  <Input
                    placeholder="e.g., Introduction to React"
                    value={topic.title}
                    onChange={(e) => updateTopic(topicIndex, 'title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Topic Description</Label>
                  <Textarea
                    placeholder="Brief description of what this topic covers"
                    value={topic.description}
                    onChange={(e) => updateTopic(topicIndex, 'description', e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              {/* Subtopics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">Subtopics</h4>
                  <Button
                    onClick={() => addSubtopic(topicIndex)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Subtopic
                  </Button>
                </div>

                {topic.subtopics.map((subtopic, subtopicIndex) => (
                  <div key={subtopicIndex} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Subtopic {subtopicIndex + 1}</span>
                        <Badge variant="secondary" className="text-xs">
                          {subtopic.moduleCount} modules
                        </Badge>
                      </div>
                      <Button
                        onClick={() => removeSubtopic(topicIndex, subtopicIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Subtopic Title *</Label>
                        <Input
                          placeholder="e.g., JSX Fundamentals"
                          value={subtopic.title}
                          onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'title', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="Brief description"
                          value={subtopic.description}
                          onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'description', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Module Count</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={subtopic.moduleCount}
                          onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'moduleCount', parseInt(e.target.value) || 1)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customStructure.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No topics added yet. Start building your course structure!</p>
          <Button onClick={addTopic} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add First Topic
          </Button>
        </div>
      )}
    </div>
  );
}
