import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GeneratedQuestion } from '@/hooks/useQuestionGeneration';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

interface InteractiveQuestionModalProps {
  activeQuestion: GeneratedQuestion | null;
  questionList: GeneratedQuestion[] | null; // Full list of questions for navigation
  currentIndex: number | null; // Current index in the questionList
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'next' | 'previous') => void; // Navigation handler
}

export const InteractiveQuestionModal: React.FC<InteractiveQuestionModalProps> = ({ 
  activeQuestion, 
  questionList,
  currentIndex,
  isOpen, 
  onClose,
  onNavigate
}) => {
  const [userAnswer, setUserAnswer] = useState<string | number | undefined>(undefined);
  const [isAttempted, setIsAttempted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    // Reset state when activeQuestion changes or modal opens
    if (isOpen && activeQuestion) {
      setUserAnswer(undefined);
      setIsAttempted(false);
      setIsCorrect(null);
    }
    // If modal closes and isOpen becomes false, parent handles clearing activeQuestion etc.
  }, [isOpen, activeQuestion]);

  if (!activeQuestion) return null;

  const question = activeQuestion; // Use current question for rendering

  const handleSubmitAnswer = () => {
    if (userAnswer === undefined) { 
        return; 
    }

    let correct = false;
    if (question.type === 'mcq') {
      correct = Number(userAnswer) === question.correctAnswer;
    } else if (question.type === 'true_false') {
      correct = typeof userAnswer === 'string' && typeof question.correctAnswer === 'string' &&
                  userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
    }

    setIsCorrect(correct);
    setIsAttempted(true);
  };

  const renderAnswerInput = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <RadioGroup
            value={userAnswer !== undefined ? String(userAnswer) : undefined}
            onValueChange={(value) => setUserAnswer(Number(value))}
            disabled={isAttempted}
            className="space-y-2"
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted has-[input:disabled]:hover:bg-transparent">
                <RadioGroupItem value={String(index)} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="font-normal cursor-pointer flex-1">{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'true_false':
        return (
          <RadioGroup
            value={userAnswer !== undefined ? String(userAnswer) : undefined}
            onValueChange={(value) => setUserAnswer(value)}
            disabled={isAttempted}
            className="flex space-x-4"
          >
            {["True", "False"].map(val => (
                <div key={val} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted has-[input:disabled]:hover:bg-transparent">
                    <RadioGroupItem value={val} id={`option-${val.toLowerCase()}`} />
                    <Label htmlFor={`option-${val.toLowerCase()}`} className="font-normal cursor-pointer">{val}</Label>
                </div>
            ))}
          </RadioGroup>
        );
      default:
        return <p className="text-sm text-muted-foreground">Only Multiple Choice and True/False questions are supported.</p>;
    }
  };

  const getCorrectAnswerDisplay = () => {
    if (question.type === 'mcq' && question.options && typeof question.correctAnswer === 'number') {
      if (question.correctAnswer >= 0 && question.correctAnswer < question.options.length) {
        return question.options[question.correctAnswer];
      }
      return "N/A (Invalid correct answer index)";
    }
    return String(question.correctAnswer);
  };
  
  const hasPrevious = questionList && currentIndex !== null && currentIndex > 0;
  const hasNext = questionList && currentIndex !== null && currentIndex < questionList.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            Attempt Question {questionList && questionList.length > 1 && currentIndex !== null ? `(${currentIndex + 1} of ${questionList.length})` : ''} - {question.type.replace("_", " ")}
          </DialogTitle>
          <DialogDescription className="pt-2 whitespace-pre-wrap">{question.question}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {renderAnswerInput()}
          
          {isAttempted && isCorrect !== null && (
            <Alert variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700" : "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700"}>
              {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
              <AlertTitle className={isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                {isCorrect ? "Correct!" : "Incorrect"}
              </AlertTitle>
              <AlertDescription className={isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                {!isCorrect && question.correctAnswer !== undefined && (
                  <p>The correct answer is: <strong>{getCorrectAnswerDisplay()}</strong></p>
                )}
                {question.explanation && (
                  <div className="mt-2 pt-2 border-t border-current/30">
                    <h4 className="font-semibold flex items-center text-sm"><Info className="h-4 w-4 mr-1.5 opacity-80" /> Explanation:</h4>
                    <p className="text-xs opacity-90">{question.explanation}</p>
                  </div>
                )}
                {!question.explanation && isCorrect && <p>Well done!</p>}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sm:justify-between mt-2">
          <div className="flex gap-2">
            {questionList && questionList.length > 1 && (
              <>
                <Button type="button" variant="outline" onClick={() => onNavigate('previous')} disabled={!hasPrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button type="button" variant="outline" onClick={() => onNavigate('next')} disabled={!hasNext}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isAttempted ? (
              <Button type="button" onClick={handleSubmitAnswer} disabled={userAnswer === undefined}>
                Submit Answer
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onClose}> 
                 {questionList && questionList.length > 1 && hasNext ? "Close" : "Done"}
              </Button>
            )}
             {isAttempted && (!questionList || questionList.length === 1 || !hasNext) && (
                 <Button type="button" onClick={onClose}>Close</Button>
             )}
             {/* If not attempted and it's a single question, show close button. Or if multi-question and attempted, already handled by "Done" */}
             {!isAttempted && (!questionList || questionList.length <=1) && (
                 <Button type="button" variant="outline" onClick={onClose}>Close</Button>
             )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
