
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCourses } from "@/hooks/useCourses";
import { useCourseEditor } from "@/hooks/useCourseEditor";
import { PageIntro } from "@/components/layout/PageIntro";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Save, Plus, Edit, RefreshCw, Loader2 } from "lucide-react";
import { AdvancedCourseEditor } from "@/components/course/AdvancedCourseEditor";

export default function UpdateCoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses, loading: coursesLoading, updateCourse } = useCourses();
  const { 
    addModules, 
    editContent, 
    restructureCourse, 
    loading: editLoading, 
    progress, 
    currentOperation 
  } = useCourseEditor();

  const [course, setCourse] = useState<any>(null);
  const [editRequest, setEditRequest] = useState('');
  const [selectedEditType, setSelectedEditType] = useState<'add_modules' | 'edit_content' | 'restructure'>('add_modules');
  const [targetPath, setTargetPath] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // Basic course info editing
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (courses && courseId) {
      const foundCourse = courses.find(c => c.id === courseId);
      if (foundCourse) {
        setCourse(foundCourse);
        setTitle(foundCourse.title);
        setDescription(foundCourse.description);
      }
    }
  }, [courses, courseId]);

  const handleBasicUpdate = async () => {
    if (!course) return;

    const success = await updateCourse(course.id, {
      title,
      description,
    });

    if (success) {
      setCourse({ ...course, title, description });
    }
  };

  const handleAIEdit = async () => {
    if (!course || !editRequest.trim()) return;

    let result;
    switch (selectedEditType) {
      case 'add_modules':
        result = await addModules(course.id, editRequest, targetPath);
        break;
      case 'edit_content':
        result = await editContent(course.id, editRequest, targetPath, course, additionalContext);
        break;
      case 'restructure':
        result = await restructureCourse(course.id, editRequest, additionalContext);
        break;
    }

    if (result) {
      setCourse(result);
      setEditRequest('');
      setTargetPath('');
      setAdditionalContext('');
    }
  };

  if (coursesLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-inter">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <PageIntro
          title="Course Not Found"
          description="The course you're trying to edit doesn't exist or an error occurred."
        />
        <EnhancedButton onClick={() => navigate("/courses")} variant="gradient" size="lg">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </EnhancedButton>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <EnhancedButton 
            onClick={() => navigate("/courses")} 
            variant="outline"
            className="glass bg-white/60 backdrop-blur-sm border-gray-300 hover:bg-white/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </EnhancedButton>
          
          <EnhancedButton 
            onClick={() => navigate(`/courses/${courseId}`)}
            variant="gradient"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            View Course
          </EnhancedButton>
        </div>
        
        <PageIntro
          title={`Edit: ${course.title}`}
          description="Update your course content and structure with AI assistance"
        />

        <Tabs defaultValue="basic" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="ai-edit">AI-Powered Editing</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Manual Editor</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Course Information
                </CardTitle>
                <CardDescription>
                  Update the basic course details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter course title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={4}
                  />
                </div>

                <EnhancedButton onClick={handleBasicUpdate} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </EnhancedButton>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-edit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  AI-Powered Course Editing
                </CardTitle>
                <CardDescription>
                  Let AI help you enhance your course structure and content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-type">Edit Type</Label>
                  <Select 
                    value={selectedEditType} 
                    onValueChange={(value: 'add_modules' | 'edit_content' | 'restructure') => setSelectedEditType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select edit type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add_modules">Add More Modules</SelectItem>
                      <SelectItem value="edit_content">Edit Content</SelectItem>
                      <SelectItem value="restructure">Restructure Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-request">Your Request</Label>
                  <Textarea
                    id="edit-request"
                    value={editRequest}
                    onChange={(e) => setEditRequest(e.target.value)}
                    placeholder={
                      selectedEditType === 'add_modules' 
                        ? "Describe what modules you want to add (e.g., 'Add 3 more modules about advanced JavaScript concepts')"
                        : selectedEditType === 'edit_content'
                        ? "Describe what content you want to change (e.g., 'Make the explanation simpler and add more examples')"
                        : "Describe how you want to restructure (e.g., 'Reorganize topics to start with basics and progress to advanced')"
                    }
                    rows={3}
                  />
                </div>

                {selectedEditType !== 'restructure' && (
                  <div>
                    <Label htmlFor="target-path">Target Location (Optional)</Label>
                    <Input
                      id="target-path"
                      value={targetPath}
                      onChange={(e) => setTargetPath(e.target.value)}
                      placeholder="e.g., topics.0.subtopics.1 (leave empty for general changes)"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="additional-context">Additional Context (Optional)</Label>
                  <Textarea
                    id="additional-context"
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any additional information to help the AI understand your request better"
                    rows={2}
                  />
                </div>

                {editLoading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{currentOperation}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                <EnhancedButton 
                  onClick={handleAIEdit} 
                  disabled={editLoading || !editRequest.trim()}
                  className="w-full"
                  variant="gradient"
                >
                  {editLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editLoading ? 'Processing...' : 'Apply AI Edit'}
                </EnhancedButton>
              </CardContent>
            </Card>

            {course.topics && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Course Structure</CardTitle>
                  <CardDescription>
                    Preview of your course structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.topics.map((topic: any, topicIndex: number) => (
                      <div key={topicIndex} className="border rounded-lg p-4">
                        <h4 className="font-semibold">{topic.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                        {topic.subtopics && (
                          <div className="pl-4">
                            {topic.subtopics.map((subtopic: any, subtopicIndex: number) => (
                              <div key={subtopicIndex} className="mb-2">
                                <h5 className="font-medium text-sm">{subtopic.title}</h5>
                                {subtopic.micro_modules && (
                                  <div className="pl-4 text-xs text-gray-500">
                                    {subtopic.micro_modules.length} modules
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <AdvancedCourseEditor 
              course={course}
              onUpdate={async (updatedCourse) => {
                const success = await updateCourse(course.id, updatedCourse);
                if (success) {
                  setCourse(updatedCourse);
                }
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
