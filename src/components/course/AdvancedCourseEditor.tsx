import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Edit2, Save, Wand2, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description?: string;
  skill_area: string;
  difficulty_level: string;
  topics: any[];
}

interface AdvancedCourseEditorProps {
  course: Course;
  onUpdate: (updatedCourse: any) => Promise<void>;
}

interface QuestionData {
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | number | boolean;
  explanation?: string;
}

export function AdvancedCourseEditor({ course, onUpdate }: AdvancedCourseEditorProps) {
  const [editingCourse, setEditingCourse] = useState<Course>(course);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedModuleForQuestions, setSelectedModuleForQuestions] = useState<string>('');

  const handleSaveCourse = async () => {
    try {
      await onUpdate(editingCourse);
      toast({
        title: "Course Updated",
        description: "Your course has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update the course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addTopic = () => {
    const newTopic = {
      title: `New Topic ${editingCourse.topics.length + 1}`,
      description: "",
      subtopics: []
    };
    setEditingCourse(prev => ({
      ...prev,
      topics: [...prev.topics, newTopic]
    }));
  };

  const updateTopic = (topicIndex: number, field: string, value: string) => {
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, index) => 
        index === topicIndex ? { ...topic, [field]: value } : topic
      )
    }));
  };

  const deleteTopic = (topicIndex: number) => {
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.filter((_, index) => index !== topicIndex)
    }));
  };

  const addSubtopic = (topicIndex: number) => {
    const newSubtopic = {
      title: `New Subtopic`,
      description: "",
      micro_modules: []
    };
    
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, index) => 
        index === topicIndex 
          ? { ...topic, subtopics: [...(topic.subtopics || []), newSubtopic] }
          : topic
      )
    }));
  };

  const updateSubtopic = (topicIndex: number, subtopicIndex: number, field: string, value: string) => {
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, tIndex) => 
        tIndex === topicIndex 
          ? {
              ...topic,
              subtopics: topic.subtopics?.map((subtopic: any, sIndex: number) =>
                sIndex === subtopicIndex ? { ...subtopic, [field]: value } : subtopic
              )
            }
          : topic
      )
    }));
  };

  const deleteSubtopic = (topicIndex: number, subtopicIndex: number) => {
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, tIndex) => 
        tIndex === topicIndex 
          ? {
              ...topic,
              subtopics: topic.subtopics?.filter((_: any, sIndex: number) => sIndex !== subtopicIndex)
            }
          : topic
      )
    }));
  };

  const addModule = (topicIndex: number, subtopicIndex: number) => {
    const newModule = {
      id: `module_${Date.now()}`,
      title: "New Module",
      content: "",
      learning_objective: "",
      estimated_duration_minutes: 5,
      quick_quiz: {
        questions: []
      }
    };

    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, tIndex) => 
        tIndex === topicIndex 
          ? {
              ...topic,
              subtopics: topic.subtopics?.map((subtopic: any, sIndex: number) =>
                sIndex === subtopicIndex 
                  ? { ...subtopic, micro_modules: [...(subtopic.micro_modules || []), newModule] }
                  : subtopic
              )
            }
          : topic
      )
    }));
  };

  const updateModule = (topicIndex: number, subtopicIndex: number, moduleIndex: number, field: string, value: any) => {
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, tIndex) => 
        tIndex === topicIndex 
          ? {
              ...topic,
              subtopics: topic.subtopics?.map((subtopic: any, sIndex: number) =>
                sIndex === subtopicIndex 
                  ? {
                      ...subtopic,
                      micro_modules: subtopic.micro_modules?.map((module: any, mIndex: number) =>
                        mIndex === moduleIndex ? { ...module, [field]: value } : module
                      )
                    }
                  : subtopic
              )
            }
          : topic
      )
    }));
  };

  const deleteModule = (topicIndex: number, subtopicIndex: number, moduleIndex: number) => {
    setEditingCourse(prev => ({
      ...prev,
      topics: prev.topics.map((topic, tIndex) => 
        tIndex === topicIndex 
          ? {
              ...topic,
              subtopics: topic.subtopics?.map((subtopic: any, sIndex: number) =>
                sIndex === subtopicIndex 
                  ? {
                      ...subtopic,
                      micro_modules: subtopic.micro_modules?.filter((_: any, mIndex: number) => mIndex !== moduleIndex)
                    }
                  : subtopic
              )
            }
          : topic
      )
    }));
  };

  const addQuestion = (topicIndex: number, subtopicIndex: number, moduleIndex: number) => {
    const newQuestion: QuestionData = {
      question: "",
      type: 'mcq',
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: ""
    };

    updateModule(topicIndex, subtopicIndex, moduleIndex, 'quick_quiz', {
      questions: [
        ...(editingCourse.topics[topicIndex]?.subtopics?.[subtopicIndex]?.micro_modules?.[moduleIndex]?.quick_quiz?.questions || []),
        newQuestion
      ]
    });
  };

  const updateQuestion = (topicIndex: number, subtopicIndex: number, moduleIndex: number, questionIndex: number, updatedQuestion: QuestionData) => {
    const currentQuestions = editingCourse.topics[topicIndex]?.subtopics?.[subtopicIndex]?.micro_modules?.[moduleIndex]?.quick_quiz?.questions || [];
    const updatedQuestions = currentQuestions.map((q: any, qIndex: number) => 
      qIndex === questionIndex ? updatedQuestion : q
    );

    updateModule(topicIndex, subtopicIndex, moduleIndex, 'quick_quiz', {
      questions: updatedQuestions
    });
  };

  const deleteQuestion = (topicIndex: number, subtopicIndex: number, moduleIndex: number, questionIndex: number) => {
    const currentQuestions = editingCourse.topics[topicIndex]?.subtopics?.[subtopicIndex]?.micro_modules?.[moduleIndex]?.quick_quiz?.questions || [];
    const updatedQuestions = currentQuestions.filter((_: any, qIndex: number) => qIndex !== questionIndex);

    updateModule(topicIndex, subtopicIndex, moduleIndex, 'quick_quiz', {
      questions: updatedQuestions
    });
  };

  const generateMoreQuestions = async (topicIndex: number, subtopicIndex: number, moduleIndex: number) => {
    setIsGeneratingQuestions(true);
    setSelectedModuleForQuestions(`${topicIndex}-${subtopicIndex}-${moduleIndex}`);
    
    try {
      // Simulate AI question generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const generatedQuestions: QuestionData[] = [
        {
          question: "What is the main concept covered in this module?",
          type: 'mcq',
          options: ["Concept A", "Concept B", "Concept C", "Concept D"],
          correctAnswer: 0,
          explanation: "This is generated by AI based on module content."
        },
        {
          question: "True or False: This concept is important for understanding the topic.",
          type: 'true_false',
          correctAnswer: true,
          explanation: "AI-generated explanation based on context."
        }
      ];

      const currentQuestions = editingCourse.topics[topicIndex]?.subtopics?.[subtopicIndex]?.micro_modules?.[moduleIndex]?.quick_quiz?.questions || [];
      
      updateModule(topicIndex, subtopicIndex, moduleIndex, 'quick_quiz', {
        questions: [...currentQuestions, ...generatedQuestions]
      });

      toast({
        title: "Questions Generated",
        description: `Added ${generatedQuestions.length} new questions to the module.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
      setSelectedModuleForQuestions('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Advanced Course Editor
            <Button onClick={handleSaveCourse} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardTitle>
          <CardDescription>
            Manually edit every aspect of your course including topics, subtopics, modules, content, and questions.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="structure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="structure">Course Structure</TabsTrigger>
          <TabsTrigger value="content">Module Content</TabsTrigger>
          <TabsTrigger value="questions">Questions & Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Topics
                <Button onClick={addTopic} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {editingCourse.topics.map((topic: any, topicIndex: number) => (
                  <AccordionItem key={topicIndex} value={`topic-${topicIndex}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>{topic.title || `Topic ${topicIndex + 1}`}</span>
                        <Badge variant="secondary">
                          {topic.subtopics?.length || 0} subtopics
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Topic Title</Label>
                          <Input
                            value={topic.title || ''}
                            onChange={(e) => updateTopic(topicIndex, 'title', e.target.value)}
                            placeholder="Enter topic title"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <Button
                            onClick={() => addSubtopic(topicIndex)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subtopic
                          </Button>
                          <Button
                            onClick={() => deleteTopic(topicIndex)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Topic Description</Label>
                        <Textarea
                          value={topic.description || ''}
                          onChange={(e) => updateTopic(topicIndex, 'description', e.target.value)}
                          placeholder="Enter topic description"
                          rows={2}
                        />
                      </div>

                      {/* Subtopics */}
                      {topic.subtopics?.map((subtopic: any, subtopicIndex: number) => (
                        <Card key={subtopicIndex} className="ml-4">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">
                                Subtopic {subtopicIndex + 1}: {subtopic.title}
                              </CardTitle>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => addModule(topicIndex, subtopicIndex)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Module
                                </Button>
                                <Button
                                  onClick={() => deleteSubtopic(topicIndex, subtopicIndex)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label>Subtopic Title</Label>
                              <Input
                                value={subtopic.title || ''}
                                onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'title', e.target.value)}
                                placeholder="Enter subtopic title"
                              />
                            </div>
                            <div>
                              <Label>Subtopic Description</Label>
                              <Textarea
                                value={subtopic.description || ''}
                                onChange={(e) => updateSubtopic(topicIndex, subtopicIndex, 'description', e.target.value)}
                                placeholder="Enter subtopic description"
                                rows={2}
                              />
                            </div>
                            
                            {/* Modules */}
                            {subtopic.micro_modules?.map((module: any, moduleIndex: number) => (
                              <div key={moduleIndex} className="border rounded p-3 bg-gray-50">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-sm">Module {moduleIndex + 1}</h4>
                                  <Button
                                    onClick={() => deleteModule(topicIndex, subtopicIndex, moduleIndex)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  <Input
                                    value={module.title || ''}
                                    onChange={(e) => updateModule(topicIndex, subtopicIndex, moduleIndex, 'title', e.target.value)}
                                    placeholder="Module title"
                                    className="text-sm"
                                  />
                                  <Input
                                    value={module.learning_objective || ''}
                                    onChange={(e) => updateModule(topicIndex, subtopicIndex, moduleIndex, 'learning_objective', e.target.value)}
                                    placeholder="Learning objective"
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Content Editor</CardTitle>
              <CardDescription>
                Edit the content of individual modules in your course.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingCourse.topics.map((topic: any, topicIndex: number) => (
                <div key={topicIndex} className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">{topic.title}</h3>
                  {topic.subtopics?.map((subtopic: any, subtopicIndex: number) => (
                    <div key={subtopicIndex} className="mb-4 ml-4">
                      <h4 className="text-md font-medium mb-3">{subtopic.title}</h4>
                      {subtopic.micro_modules?.map((module: any, moduleIndex: number) => (
                        <Card key={moduleIndex} className="mb-3">
                          <CardHeader>
                            <CardTitle className="text-sm">{module.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <Label>Module Content (HTML/Markdown)</Label>
                                <Textarea
                                  value={module.content || ''}
                                  onChange={(e) => updateModule(topicIndex, subtopicIndex, moduleIndex, 'content', e.target.value)}
                                  placeholder="Enter module content (supports HTML and Markdown)"
                                  rows={8}
                                  className="font-mono text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label>Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    value={module.estimated_duration_minutes || 5}
                                    onChange={(e) => updateModule(topicIndex, subtopicIndex, moduleIndex, 'estimated_duration_minutes', parseInt(e.target.value))}
                                    min={1}
                                    max={60}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Questions & Quiz Editor</CardTitle>
              <CardDescription>
                Manage questions for each module. You can add questions manually or generate them with AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingCourse.topics.map((topic: any, topicIndex: number) => (
                <div key={topicIndex} className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">{topic.title}</h3>
                  {topic.subtopics?.map((subtopic: any, subtopicIndex: number) => (
                    <div key={subtopicIndex} className="mb-4 ml-4">
                      <h4 className="text-md font-medium mb-3">{subtopic.title}</h4>
                      {subtopic.micro_modules?.map((module: any, moduleIndex: number) => (
                        <Card key={moduleIndex} className="mb-3">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm">{module.title}</CardTitle>
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => addQuestion(topicIndex, subtopicIndex, moduleIndex)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Question
                                </Button>
                                <Button
                                  onClick={() => generateMoreQuestions(topicIndex, subtopicIndex, moduleIndex)}
                                  size="sm"
                                  disabled={isGeneratingQuestions && selectedModuleForQuestions === `${topicIndex}-${subtopicIndex}-${moduleIndex}`}
                                >
                                  <Wand2 className="h-3 w-3 mr-1" />
                                  {isGeneratingQuestions && selectedModuleForQuestions === `${topicIndex}-${subtopicIndex}-${moduleIndex}` ? 'Generating...' : 'AI Generate'}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {module.quick_quiz?.questions?.map((question: any, questionIndex: number) => (
                              <div key={questionIndex} className="border rounded p-3 mb-3 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-medium text-sm">Question {questionIndex + 1}</h5>
                                  <Button
                                    onClick={() => deleteQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <Label>Question</Label>
                                    <Input
                                      value={question.question || ''}
                                      onChange={(e) => updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                        ...question,
                                        question: e.target.value
                                      })}
                                      placeholder="Enter your question"
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label>Question Type</Label>
                                    <Select
                                      value={question.type}
                                      onValueChange={(value: 'mcq' | 'true_false' | 'short_answer') => 
                                        updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                          ...question,
                                          type: value,
                                          options: value === 'mcq' ? ['', '', '', ''] : undefined
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                                        <SelectItem value="true_false">True/False</SelectItem>
                                        <SelectItem value="short_answer">Short Answer</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {question.type === 'mcq' && (
                                    <div>
                                      <Label>Options</Label>
                                      {question.options?.map((option: string, optionIndex: number) => (
                                        <div key={optionIndex} className="flex items-center space-x-2 mt-2">
                                          <span className="text-sm font-medium">{String.fromCharCode(65 + optionIndex)}.</span>
                                          <Input
                                            value={option}
                                            onChange={(e) => {
                                              const updatedOptions = [...question.options];
                                              updatedOptions[optionIndex] = e.target.value;
                                              updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                                ...question,
                                                options: updatedOptions
                                              });
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                          />
                                        </div>
                                      ))}
                                      <div className="mt-2">
                                        <Label>Correct Answer</Label>
                                        <Select
                                          value={String(question.correctAnswer)}
                                          onValueChange={(value) => updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                            ...question,
                                            correctAnswer: parseInt(value)
                                          })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {question.options?.map((_: any, optionIndex: number) => (
                                              <SelectItem key={optionIndex} value={String(optionIndex)}>
                                                Option {String.fromCharCode(65 + optionIndex)}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'true_false' && (
                                    <div>
                                      <Label>Correct Answer</Label>
                                      <Select
                                        value={String(question.correctAnswer)}
                                        onValueChange={(value) => updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                          ...question,
                                          correctAnswer: value === 'true'
                                        })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="true">True</SelectItem>
                                          <SelectItem value="false">False</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}

                                  {question.type === 'short_answer' && (
                                    <div>
                                      <Label>Expected Answer</Label>
                                      <Input
                                        value={String(question.correctAnswer)}
                                        onChange={(e) => updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                          ...question,
                                          correctAnswer: e.target.value
                                        })}
                                        placeholder="Enter the expected answer"
                                      />
                                    </div>
                                  )}

                                  <div>
                                    <Label>Explanation (Optional)</Label>
                                    <Textarea
                                      value={question.explanation || ''}
                                      onChange={(e) => updateQuestion(topicIndex, subtopicIndex, moduleIndex, questionIndex, {
                                        ...question,
                                        explanation: e.target.value
                                      })}
                                      placeholder="Explain why this is the correct answer"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </div>
                            )) || (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No questions added yet. Click "Add Question" or "AI Generate" to create questions.
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}