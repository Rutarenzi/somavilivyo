
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Edit, 
  Save, 
  Wand2, 
  BookOpen, 
  AlertCircle,
  Edit3,
  Sparkles
} from "lucide-react";
import { useCourseEditor } from "@/hooks/useCourseEditor";
import { useToast } from "@/hooks/use-toast";
import { ManualCourseEditor } from "./ManualCourseEditor";

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  topics: any[];
}

interface ComprehensiveCourseEditorProps {
  course: Course;
  onUpdate: (updatedCourse: Course) => void;
}

export function ComprehensiveCourseEditor({ course, onUpdate }: ComprehensiveCourseEditorProps) {
  const [editedCourse, setEditedCourse] = useState<Course>(course);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // Default to manual tab
  const [aiEditDialog, setAiEditDialog] = useState(false);
  const [aiEditType, setAiEditType] = useState<'add_modules' | 'edit_content' | 'restructure'>('edit_content');
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedPath, setSelectedPath] = useState('');

  const { editContent, restructureCourse, addModules, loading, progress, currentOperation } = useCourseEditor();
  const { toast } = useToast();

  useEffect(() => {
    setHasChanges(JSON.stringify(editedCourse) !== JSON.stringify(course));
  }, [editedCourse, course]);

  useEffect(() => {
    setEditedCourse(course);
  }, [course]);

  const handleBasicSave = () => {
    onUpdate(editedCourse);
    toast({
      title: "Changes Saved",
      description: "Course information has been updated successfully.",
    });
  };

  const handleAiEdit = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a description of what you want to change.",
        variant: "destructive",
      });
      return;
    }

    try {
      let result;
      
      switch (aiEditType) {
        case 'add_modules':
          result = await addModules(course.id, aiPrompt, selectedPath, editedCourse);
          break;
        case 'edit_content':
          result = await editContent(course.id, aiPrompt, selectedPath, editedCourse, "Comprehensive course editing");
          break;
        case 'restructure':
          result = await restructureCourse(course.id, aiPrompt, "Full course restructure");
          break;
      }

      if (result) {
        setEditedCourse(result);
        setAiEditDialog(false);
        setAiPrompt('');
        setSelectedPath('');
        toast({
          title: "AI Edit Complete",
          description: "Your course has been updated using AI assistance.",
        });
      }
    } catch (error) {
      console.error('AI edit failed:', error);
      toast({
        title: "AI Edit Failed",
        description: "There was an error processing your AI request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Edit Progress */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">{currentOperation}</span>
                <span className="text-sm text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Dialog open={aiEditDialog} onOpenChange={setAiEditDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-purple-600 border-purple-300">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI Course Editor
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-type">Edit Type</Label>
                  <Select value={aiEditType} onValueChange={(value: any) => setAiEditType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="edit_content">Edit Content</SelectItem>
                      <SelectItem value="add_modules">Add Modules</SelectItem>
                      <SelectItem value="restructure">Restructure Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-prompt">What would you like to change?</Label>
                  <Textarea
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe what you want to change about your course..."
                    rows={4}
                  />
                </div>

                {aiEditType !== 'restructure' && (
                  <div>
                    <Label htmlFor="target-path">Target Section (Optional)</Label>
                    <Input
                      id="target-path"
                      value={selectedPath}
                      onChange={(e) => setSelectedPath(e.target.value)}
                      placeholder="e.g., topics.0.subtopics.1"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setAiEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAiEdit} disabled={loading || !aiPrompt.trim()}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Apply AI Edit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleBasicSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Course Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual" className="flex items-center">
            <Edit3 className="h-4 w-4 mr-2" />
            Manual Editor
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Quick Overview
          </TabsTrigger>
          <TabsTrigger value="ai-tools" className="flex items-center">
            <Wand2 className="h-4 w-4 mr-2" />
            AI Tools
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6 mt-6">
          <ManualCourseEditor 
            course={editedCourse} 
            onUpdate={(updatedCourse) => {
              setEditedCourse(updatedCourse);
            }} 
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6 mt-6">
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
                  onChange={(e) => setEditedCourse(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="course-description">Description</Label>
                <Textarea
                  id="course-description"
                  value={editedCourse.description}
                  onChange={(e) => setEditedCourse(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select 
                    value={editedCourse.difficulty_level} 
                    onValueChange={(value) => setEditedCourse(prev => ({ ...prev, difficulty_level: value }))}
                  >
                    <SelectTrigger>
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
                    onChange={(e) => setEditedCourse(prev => ({ ...prev, estimated_duration: e.target.value }))}
                    placeholder="e.g., 2 hours"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Course Structure Overview</h4>
                <div className="space-y-3">
                  {editedCourse.topics?.map((topic: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg bg-gray-50">
                      <h5 className="font-medium">{topic.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span>Subtopics: {topic.subtopics?.length || 0}</span>
                        <span>Duration: {topic.estimatedDuration || 'Not set'}</span>
                        <span>Difficulty: {topic.difficulty || 'Not set'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2" />
                AI-Powered Course Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Use the AI Assistant button above to access powerful AI editing tools for your course content.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Edit Content</h4>
                  <p className="text-sm text-gray-600">Improve existing course content with AI assistance</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Add Modules</h4>
                  <p className="text-sm text-gray-600">Generate new modules and content for your course</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Restructure</h4>
                  <p className="text-sm text-gray-600">Reorganize your course structure and flow</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
