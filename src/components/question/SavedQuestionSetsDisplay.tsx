
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FetchedQuestionSet, GeneratedQuestion } from '@/hooks/useQuestionGeneration';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Eye, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface SavedQuestionSetsDisplayProps {
  sets: FetchedQuestionSet[];
  onAttemptQuestionSet: (questions: GeneratedQuestion[], startIndex: number) => void;
  onDeleteSet: (setId: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const SavedQuestionSetsDisplay: React.FC<SavedQuestionSetsDisplayProps> = ({
  sets,
  onAttemptQuestionSet,
  onDeleteSet,
  isLoading,
  error,
}) => {
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 p-3 rounded-md flex items-start space-x-2 dark:bg-red-900/30 dark:text-red-400">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm">Error loading saved sets: {error}</p>
      </div>
    );
  }

  if (!isLoading && sets.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">You haven't saved any question sets yet.</p>;
  }

  return (
    <div className="space-y-4">
      {sets.map((set) => (
        <Card key={set.id} className="shadow-sm">
          <CardHeader className="flex flex-row justify-between items-start pb-2 pt-3 px-4">
            <div>
              <CardTitle className="text-base font-semibold">{set.selected_course_title || "Untitled Set"}</CardTitle>
              <CardDescription className="text-xs">
                {set.generated_questions.length} question{set.generated_questions.length !== 1 ? 's' : ''} &bull; Saved {formatDistanceToNow(new Date(set.created_at), { addSuffix: true })}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteSet(set.id)}
              disabled={isLoading}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
              title="Delete Set"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <Accordion
              type="single"
              collapsible
              value={expandedSetId || ""} // Use expandedSetId directly (or empty string if null)
              onValueChange={setExpandedSetId} // Pass the setter directly, it will receive set.id or ""
            >
              <AccordionItem value={set.id} className="border-b-0">
                <AccordionTrigger className="text-sm py-2 hover:no-underline justify-start text-indigo-600 hover:text-indigo-800">
                  {expandedSetId === set.id ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                  {expandedSetId === set.id ? 'Hide Questions' : 'View Questions'}
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-2">
                  {set.generated_questions.map((q, index) => (
                    <div key={index} className="p-3 border rounded-md bg-muted/30 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight mb-1" title={q.question}>
                          {index + 1}. {q.question}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{q.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>Answer hidden until attempted</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAttemptQuestionSet(set.generated_questions, index)}
                        className="w-full sm:w-auto sm:ml-2 py-2 px-4 h-auto text-sm font-medium whitespace-nowrap flex-shrink-0 min-w-[80px] flex items-center justify-center gap-2"
                        title="Attempt Question"
                      >
                        <Eye className="h-4 w-4" /> 
                        <span>Try</span>
                      </Button>
                    </div>
                  ))}
                  {set.generated_questions.length === 0 && <p className="text-xs text-muted-foreground">This set has no questions.</p>}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

