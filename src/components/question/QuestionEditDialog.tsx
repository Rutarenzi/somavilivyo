import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, Save, X } from "lucide-react";
import { GeneratedQuestion } from "@/hooks/useQuestionGeneration";

interface QuestionEditDialogProps {
  question: GeneratedQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedQuestion: GeneratedQuestion) => void;
}

export const QuestionEditDialog: React.FC<QuestionEditDialogProps> = ({
  question,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedQuestion, setEditedQuestion] = useState<GeneratedQuestion | null>(null);

  useEffect(() => {
    if (question) {
      setEditedQuestion({ ...question });
    }
  }, [question]);

  if (!editedQuestion) {
    return null;
  }

  const handleSave = () => {
    if (editedQuestion) {
      onSave(editedQuestion);
      onClose();
    }
  };

  const updateQuestion = (field: keyof GeneratedQuestion, value: any) => {
    setEditedQuestion(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateOption = (index: number, value: string) => {
    if (!editedQuestion.options) return;
    const newOptions = [...editedQuestion.options];
    newOptions[index] = value;
    updateQuestion('options', newOptions);
  };

  const addOption = () => {
    if (!editedQuestion.options) return;
    updateQuestion('options', [...editedQuestion.options, '']);
  };

  const removeOption = (index: number) => {
    if (!editedQuestion.options || editedQuestion.options.length <= 2) return;
    const newOptions = editedQuestion.options.filter((_, i) => i !== index);
    updateQuestion('options', newOptions);
    
    // Adjust correct answer if necessary
    if (typeof editedQuestion.correctAnswer === 'number' && editedQuestion.correctAnswer >= index) {
      const newCorrectAnswer = editedQuestion.correctAnswer > index 
        ? editedQuestion.correctAnswer - 1 
        : editedQuestion.correctAnswer;
      updateQuestion('correctAnswer', newCorrectAnswer);
    }
  };

  const setCorrectAnswer = (index: number) => {
    updateQuestion('correctAnswer', index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Question
            <Badge variant="outline">{editedQuestion.type === 'mcq' ? 'Multiple Choice' : 'True/False'}</Badge>
          </DialogTitle>
          <DialogDescription>
            Modify the question content, options, and correct answer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Type */}
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={editedQuestion.type}
              onValueChange={(value: 'mcq' | 'true_false') => {
                updateQuestion('type', value);
                if (value === 'true_false') {
                  updateQuestion('options', ['True', 'False']);
                  updateQuestion('correctAnswer', 'True');
                } else if (value === 'mcq' && (!editedQuestion.options || editedQuestion.options.length < 2)) {
                  updateQuestion('options', ['Option A', 'Option B', 'Option C', 'Option D']);
                  updateQuestion('correctAnswer', 0);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">Question</Label>
            <Textarea
              id="question-text"
              value={editedQuestion.question}
              onChange={(e) => updateQuestion('question', e.target.value)}
              placeholder="Enter the question..."
              className="min-h-[100px]"
            />
          </div>

          {/* Options for MCQ */}
          {editedQuestion.type === 'mcq' && editedQuestion.options && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={editedQuestion.options.length >= 6}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {editedQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      checked={editedQuestion.correctAnswer === index}
                      onCheckedChange={(checked) => {
                        if (checked) setCorrectAnswer(index);
                      }}
                    />
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      disabled={editedQuestion.options!.length <= 2}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select the checkbox next to the correct answer.
              </p>
            </div>
          )}

          {/* True/False Answer */}
          {editedQuestion.type === 'true_false' && (
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Select
                value={String(editedQuestion.correctAnswer)}
                onValueChange={(value) => updateQuestion('correctAnswer', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="True">True</SelectItem>
                  <SelectItem value="False">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={editedQuestion.explanation || ''}
              onChange={(e) => updateQuestion('explanation', e.target.value)}
              placeholder="Provide an explanation for the correct answer..."
              className="min-h-[80px]"
            />
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Preview:</h4>
            <div className="space-y-2">
              <p className="text-sm font-medium">{editedQuestion.question}</p>
              {editedQuestion.type === 'mcq' && editedQuestion.options && (
                <div className="space-y-1">
                  {editedQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded border ${
                        editedQuestion.correctAnswer === index
                          ? 'bg-green-100 border-green-200 font-medium'
                          : 'bg-background'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </div>
                  ))}
                </div>
              )}
              {editedQuestion.type === 'true_false' && (
                <Badge variant={editedQuestion.correctAnswer === 'True' ? 'default' : 'secondary'}>
                  Answer: {String(editedQuestion.correctAnswer)}
                </Badge>
              )}
              {editedQuestion.explanation && (
                <p className="text-xs text-muted-foreground italic">
                  <strong>Explanation:</strong> {editedQuestion.explanation}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};