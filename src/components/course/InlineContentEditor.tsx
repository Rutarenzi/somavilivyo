
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Edit3, 
  Save, 
  X, 
  Eye, 
  Wand2, 
  RotateCcw,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCourseEditor } from "@/hooks/useCourseEditor";

interface InlineContentEditorProps {
  courseId: string;
  moduleId: string;
  title: string;
  content: string;
  learningObjective: string;
  onContentUpdate: (updatedContent: string, updatedObjective: string) => void;
  canEdit?: boolean;
}

export function InlineContentEditor({
  courseId,
  moduleId,
  title,
  content,
  learningObjective,
  onContentUpdate,
  canEdit = true
}: InlineContentEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [editedObjective, setEditedObjective] = useState(learningObjective);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { editContent, loading } = useCourseEditor();

  useEffect(() => {
    setHasChanges(editedContent !== content || editedObjective !== learningObjective);
  }, [editedContent, editedObjective, content, learningObjective]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedContent(content);
    setEditedObjective(learningObjective);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }

    try {
      const result = await editContent(
        courseId,
        `Update module content: ${editedContent.slice(0, 100)}...`,
        `modules.${moduleId}`,
        {
          title,
          content: editedContent,
          learning_objective: editedObjective
        },
        "User manual edit via inline editor"
      );

      if (result) {
        onContentUpdate(editedContent, editedObjective);
        setIsEditing(false);
        toast({
          title: "Content Updated Successfully",
          description: "Your changes have been saved and applied.",
        });
      }
    } catch (error) {
      console.error("Failed to save content:", error);
      toast({
        title: "Save Failed",
        description: "There was an error saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setEditedObjective(learningObjective);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleAiEnhance = async () => {
    try {
      const result = await editContent(
        courseId,
        "Enhance and improve this module content for better clarity and engagement",
        `modules.${moduleId}`,
        {
          title,
          content: editedContent,
          learning_objective: editedObjective
        },
        "AI enhancement request"
      );

      if (result) {
        // Extract updated content from result
        const updatedContent = result.content || editedContent;
        const updatedObjective = result.learning_objective || editedObjective;
        
        setEditedContent(updatedContent);
        setEditedObjective(updatedObjective);
        
        toast({
          title: "Content Enhanced",
          description: "AI has improved your content. Review and save if you're satisfied.",
        });
      }
    } catch (error) {
      console.error("AI enhancement failed:", error);
      toast({
        title: "Enhancement Failed",
        description: "AI enhancement couldn't be completed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateAiSuggestions = () => {
    // Mock AI suggestions - in real implementation, this would call an AI service
    const suggestions = [
      "Add a real-world example to illustrate the concept",
      "Include a step-by-step breakdown of the process",
      "Provide comparison with similar concepts",
      "Add visual metaphors to explain complex ideas",
      "Include common misconceptions and how to avoid them"
    ];
    setAiSuggestions(suggestions);
  };

  if (!canEdit) {
    return (
      <div className="space-y-4">
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Edit Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button
              onClick={handleStartEdit}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Content</span>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || loading}
                size="sm"
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </Button>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleAiEnhance}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2 text-purple-600 border-purple-300"
            >
              <Wand2 className="h-4 w-4" />
              <span>AI Enhance</span>
            </Button>
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Learning Objective Editor */}
      {isEditing && (
        <Card className="border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-indigo-700">Learning Objective</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={editedObjective}
              onChange={(e) => setEditedObjective(e.target.value)}
              placeholder="Enter the learning objective for this module..."
              className="min-h-[60px] resize-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Content Editor/Display */}
      {isEditing ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Enter your module content here..."
                className="min-h-[400px] font-mono text-sm resize-none"
              />
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-purple-700">AI Writing Suggestions</CardTitle>
                <Button
                  onClick={generateAiSuggestions}
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-300"
                >
                  Generate Ideas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiSuggestions.length > 0 ? (
                <ul className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-purple-700">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-purple-600">Click "Generate Ideas" to get AI-powered suggestions for improving your content.</p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          {showPreview && (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: editedContent }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}
    </div>
  );
}
