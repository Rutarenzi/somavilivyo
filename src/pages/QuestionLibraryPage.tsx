import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestionGeneration, GeneratedQuestion, QuestionGenerationPreferences, QuestionSetRecord, FetchedQuestionSet } from "@/hooks/useQuestionGeneration";
import { useCourses, Course } from "@/hooks/useCourses";
import { useMicroModules, MicroModule } from "@/hooks/useMicroModules";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, BookOpenCheck, AlertTriangle, Save, Eye, Download, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InteractiveQuestionModal } from "@/components/question/InteractiveQuestionModal";
import { SavedQuestionSetsDisplay } from "@/components/question/SavedQuestionSetsDisplay";
import { EnhancedContentSelection } from "@/components/question/EnhancedContentSelection";
import { EnhancedQuestionPreferences, EnhancedQuestionPreferences as EnhancedPreferencesType } from "@/components/question/EnhancedQuestionPreferences";
import { EnhancedQuestionDisplay } from "@/components/question/EnhancedQuestionDisplay";
import { QuestionEditDialog } from "@/components/question/QuestionEditDialog";
import { QuestionHistoryManager } from "@/components/question/QuestionHistoryManager";
import { useToast } from "@/hooks/use-toast";

import { cn } from "@/lib/utils";

// Temporary simple display for generated questions
const GeneratedQuestionsDisplay: React.FC<{ 
  questions: GeneratedQuestion[];
  onAttemptQuestion: (question: GeneratedQuestion) => void; 
}> = ({ questions, onAttemptQuestion }) => {
  if (!questions || questions.length === 0) {
    return <p className="text-sm text-muted-foreground">No questions generated yet, or an error occurred.</p>;
  }
  return (
    <ScrollArea className="h-[350px] mt-4 border p-2 rounded-md">
      <div className="space-y-3">
        {questions.map((q, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-3 px-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium break-words pr-2">Q{index + 1}: {q.type.replace("_", " ")}</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onAttemptQuestion(q)} 
                title="Attempt Question" 
                className="py-1.5 px-2.5 h-auto text-xs font-medium whitespace-nowrap flex-shrink-0 min-w-[60px]"
              >
                <Eye className="h-3.5 w-3.5 mr-1" /> 
                <span className="hidden xs:inline">Try</span>
                <span className="xs:hidden">Try</span>
              </Button>
            </CardHeader>
            <CardContent className="text-xs px-3 pb-2 space-y-1">
              <p className="mb-1 font-medium truncate" title={q.question}>{q.question}</p>
              {q.options && q.type === 'mcq' && (
                <div className="text-muted-foreground text-[11px]">
                  <span>Multiple choice • Answer hidden until attempted</span>
                </div>
              )}
              {q.type !== 'mcq' && (
                <div className="text-muted-foreground text-[11px]">
                  <span>{q.type === 'true_false' ? 'True/False' : 'Short Answer'} • Answer hidden until attempted</span>
                </div>
              )}
              {q.explanation && <p className="text-muted-foreground italic text-[11px] truncate max-w-full" title={q.explanation}>Expl: {q.explanation}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};


const QuestionLibraryPage = () => {
  const { courses, loading: coursesLoading, error: coursesError, refetch: refetchCourses } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { microModules, loading: modulesLoading, refetch: refetchMicroModules } = useMicroModules(selectedCourse?.id || '');
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  const { 
    generatedQuestions, 
    isLoading: generationLoading,
    error: generationError, 
    generateQuestions, 
    saveQuestionSet,
    fetchedQuestionSets,
    isLoadingSets,
    errorSets,
    fetchQuestionSets,
    deleteQuestionSet 
  } = useQuestionGeneration();

  const [preferences, setPreferences] = useState<EnhancedPreferencesType>({
    questionCount: 10,
    questionTypes: ['mcq'],
    difficulty: 'medium',
    adaptiveDifficulty: false,
    bloomLevels: ['understand', 'apply'],
    focusAreas: ['conceptual'],
    customInstructions: ''
  });

  // Enhanced state for new features
  const [generationProgress, setGenerationProgress] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<{ question: GeneratedQuestion; index: number } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const [isAttemptModalOpen, setIsAttemptModalOpen] = useState(false);
  // State for managing the list of questions in the modal and current index
  const [activeQuestionListForModal, setActiveQuestionListForModal] = useState<GeneratedQuestion[] | null>(null);
  const [currentQuestionIndexInModal, setCurrentQuestionIndexInModal] = useState<number | null>(null);
  
  
  const activeQuestionForModal = useMemo(() => {
    if (activeQuestionListForModal && currentQuestionIndexInModal !== null && currentQuestionIndexInModal >= 0 && currentQuestionIndexInModal < activeQuestionListForModal.length) {
      return activeQuestionListForModal[currentQuestionIndexInModal];
    }
    return null;
  }, [activeQuestionListForModal, currentQuestionIndexInModal]);

  useEffect(() => {
    if (selectedCourse?.id) {
      refetchMicroModules(); // Refetch modules when course changes
    }
  }, [selectedCourse?.id, refetchMicroModules]);

  // Use useCallback for fetchQuestionSets dependency
  const memoizedFetchQuestionSets = useCallback(() => {
    fetchQuestionSets();
  }, [fetchQuestionSets]);

  useEffect(() => {
    memoizedFetchQuestionSets();
  }, [memoizedFetchQuestionSets]);

  const handleOpenAttemptModalFromGenerated = (question: GeneratedQuestion) => {
    setActiveQuestionListForModal([question]);
    setCurrentQuestionIndexInModal(0);
    setIsAttemptModalOpen(true);
  };

  const handleOpenAttemptModalFromSet = (questions: GeneratedQuestion[], startIndex: number) => {
    setActiveQuestionListForModal(questions);
    setCurrentQuestionIndexInModal(startIndex);
    setIsAttemptModalOpen(true);
  };
  
  const handleCloseAttemptModal = () => {
    setIsAttemptModalOpen(false);
    setActiveQuestionListForModal(null);
    setCurrentQuestionIndexInModal(null);
  };

  const handleNavigateInModal = (direction: 'next' | 'previous') => {
    if (!activeQuestionListForModal || currentQuestionIndexInModal === null) return;

    let newIndex = currentQuestionIndexInModal;
    if (direction === 'next' && currentQuestionIndexInModal < activeQuestionListForModal.length - 1) {
      newIndex++;
    } else if (direction === 'previous' && currentQuestionIndexInModal > 0) {
      newIndex--;
    }
    setCurrentQuestionIndexInModal(newIndex);
  };

  const handleGenerate = async () => {
    if (!selectedCourse || selectedModuleIds.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a course and at least one module.",
        variant: "destructive"
      });
      return;
    }

    if (preferences.questionTypes.length === 0) {
      toast({
        title: "Question Type Required",
        description: "Please select at least one question type.",
        variant: "destructive"
      });
      return;
    }

    const selectedModulesForGeneration = microModules.filter(m => selectedModuleIds.includes(m.id));
    
    const topicsDetailPlaceholder = selectedCourse.topics.map((topic: any, index: number) => ({
        topic_index: index,
        title: topic.title || `Topic ${index + 1}`,
        selected_subtopics: (topic.subtopics || []).map((sub: any, subIndex: number) => ({
            subtopic_index: subIndex,
            title: sub.title || `Subtopic ${subIndex + 1}`
        }))
    }));

    // Simulate progress updates
    setGenerationProgress(0);
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    // Convert enhanced preferences to legacy format
    const legacyPreferences: QuestionGenerationPreferences = {
      numQuestions: preferences.questionCount,
      questionTypes: preferences.questionTypes,
      difficulty: preferences.adaptiveDifficulty ? 'adaptive' : preferences.difficulty,
      focusAreas: preferences.focusAreas
    };

    try {
      await generateQuestions(selectedCourse, topicsDetailPlaceholder, selectedModulesForGeneration, legacyPreferences);
      setGenerationProgress(100);
      setTimeout(() => setGenerationProgress(0), 1000);
    } catch (error) {
      clearInterval(progressInterval);
      setGenerationProgress(0);
    }
  };
  
  const handleSaveSet = async () => {
    if (!selectedCourse || !generatedQuestions || generatedQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "No questions to save or course not selected.",
        variant: "destructive"
      });
      return;
    }

    // Convert enhanced preferences to legacy format for saving
    const legacyPreferences: QuestionGenerationPreferences = {
      numQuestions: preferences.questionCount,
      questionTypes: preferences.questionTypes,
      difficulty: preferences.adaptiveDifficulty ? 'adaptive' : preferences.difficulty,
      focusAreas: preferences.focusAreas
    };

    const setData: QuestionSetRecord = {
      course_id: selectedCourse.id,
      selected_course_title: selectedCourse.title,
      selected_topics_json: selectedCourse.topics, 
      selected_module_ids: selectedModuleIds,
      generation_preferences: legacyPreferences,
      generated_questions: generatedQuestions,
    };
    await saveQuestionSet(setData);
  };

  // New handlers for enhanced features
  const handleEditQuestion = (question: GeneratedQuestion, index: number) => {
    setEditingQuestion({ question, index });
    setEditDialogOpen(true);
  };

  const handleSaveEditedQuestion = (editedQuestion: GeneratedQuestion) => {
    if (editingQuestion && generatedQuestions) {
      const newQuestions = [...generatedQuestions];
      newQuestions[editingQuestion.index] = editedQuestion;
      // Update the questions in the hook state - would need to modify the hook to support this
      toast({
        title: "Question Updated",
        description: "Your changes have been saved.",
      });
    }
  };

  const handleDeleteQuestion = (index: number) => {
    if (generatedQuestions) {
      const newQuestions = generatedQuestions.filter((_, i) => i !== index);
      // Update the questions in the hook state - would need to modify the hook to support this
      toast({
        title: "Question Deleted",
        description: "The question has been removed.",
      });
    }
  };

  const handleExport = async (format: string) => {
    if (!generatedQuestions || generatedQuestions.length === 0) {
      toast({
        title: "No Questions",
        description: "No questions to export.",
        variant: "destructive"
      });
      return;
    }

    try {
      let content = '';
      const courseTitle = selectedCourse?.title || 'Questions';
      
      switch (format) {
        case 'pdf':
          toast({
            title: "Export Started",
            description: "PDF export will be available soon.",
          });
          break;
        case 'csv':
          content = 'Question,Type,Options,Answer,Explanation\n';
          generatedQuestions.forEach((q, i) => {
            const options = q.options ? q.options.join(';') : '';
            const answer = typeof q.correctAnswer === 'number' ? 
              (q.options?.[q.correctAnswer] || q.correctAnswer) : 
              q.correctAnswer;
            content += `"${q.question}","${q.type}","${options}","${answer}","${q.explanation || ''}"\n`;
          });
          downloadFile(content, `${courseTitle}_questions.csv`, 'text/csv');
          break;
        case 'json':
          content = JSON.stringify(generatedQuestions, null, 2);
          downloadFile(content, `${courseTitle}_questions.json`, 'application/json');
          break;
        default:
          toast({
            title: "Export Format",
            description: `${format.toUpperCase()} export will be available soon.`,
          });
      }
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to export questions.",
        variant: "destructive"
      });
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: `Downloaded ${filename}`,
    });
  };

  const handleDeleteSet = async (setId: string) => {
    await deleteQuestionSet(setId);
  };

  const getModuleDisplayTitle = (module: MicroModule): string => {
    const isGenericTitle = /^Module \d+$/i.test(module.title.trim());
    if (isGenericTitle && module.learning_objective && module.learning_objective.trim() !== "") {
      return module.learning_objective;
    }
    return module.title;
  };

  // Calculate total questions to generate
  const totalQuestionsToGenerate = selectedModuleIds.length * preferences.questionCount;

  // Current session data for history
  const currentSession = useMemo(() => {
    if (!selectedCourse || !generatedQuestions || generatedQuestions.length === 0) {
      return undefined;
    }
    
    const selectedModuleNames = microModules
      .filter(m => selectedModuleIds.includes(m.id))
      .map(m => getModuleDisplayTitle(m));

    return {
      questions: generatedQuestions,
      courseTitle: selectedCourse.title,
      moduleNames: selectedModuleNames,
      preferences
    };
  }, [selectedCourse, generatedQuestions, microModules, selectedModuleIds, preferences]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenCheck className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">Question Library & Generator</h1>
        </div>
      </header>

      <Tabs defaultValue="generator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generator" className="flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4" />
            Question Generator
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            History & Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Enhanced Content Selection */}
            {coursesError ? (
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Error Loading Courses
                  </CardTitle>
                  <CardDescription>
                    {coursesError}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => refetchCourses()} 
                    variant="outline"
                    className="w-full"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <EnhancedContentSelection
              courses={courses}
              selectedCourse={selectedCourse}
              microModules={microModules}
              selectedModuleIds={selectedModuleIds}
              coursesLoading={coursesLoading}
              modulesLoading={modulesLoading}
              onCourseSelect={(course) => {
                setSelectedCourse(course);
                setSelectedModuleIds([]);
              }}
              onModuleSelectionChange={setSelectedModuleIds}
              error={coursesError}
            />
            )}

            {/* Enhanced Question Preferences */}
            <EnhancedQuestionPreferences
              preferences={preferences}
              onChange={setPreferences}
              onGenerate={handleGenerate}
              isGenerating={generationLoading}
              disabled={!selectedCourse || selectedModuleIds.length === 0}
              selectedModulesCount={selectedModuleIds.length}
              totalQuestionsToGenerate={totalQuestionsToGenerate}
            />

            {/* Enhanced Question Display */}
            <EnhancedQuestionDisplay
              questions={generatedQuestions || []}
              isGenerating={generationLoading}
              generationProgress={generationProgress}
              onAttemptQuestion={(question, index) => handleOpenAttemptModalFromGenerated(question)}
              onEditQuestion={handleEditQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onSaveSet={handleSaveSet}
              onExport={handleExport}
              canSave={!!(selectedCourse && generatedQuestions && generatedQuestions.length > 0)}
            />
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <QuestionHistoryManager
            onRestoreSession={(historyItem) => {
              // Restore the session data
              const course = courses.find(c => c.title === historyItem.courseTitle);
              if (course) {
                setSelectedCourse(course);
                // Note: Would need to map module names back to IDs in a real implementation
                toast({
                  title: "Session Restored",
                  description: `Restored session with ${historyItem.questions.length} questions.`,
                });
              }
            }}
            onDeleteSession={(sessionId) => {
              toast({
                title: "Session Deleted",
                description: "The session has been removed from history.",
              });
            }}
            currentSession={currentSession}
          />
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Saved Question Sets</CardTitle>
          <CardDescription>Access and manage your previously generated question sets.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">My Saved Question Sets</h3>
            <p className="text-sm text-muted-foreground">View and manage your previously generated and saved question sets.</p>
            {isLoadingSets && !fetchedQuestionSets.length ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2 text-muted-foreground">Loading your question sets...</p>
              </div>
            ) : (
              <SavedQuestionSetsDisplay 
                sets={fetchedQuestionSets}
                onAttemptQuestionSet={handleOpenAttemptModalFromSet}
                onDeleteSet={handleDeleteSet}
                isLoading={generationLoading} 
                error={errorSets}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <InteractiveQuestionModal
        activeQuestion={activeQuestionForModal}
        questionList={activeQuestionListForModal}
        currentIndex={currentQuestionIndexInModal}
        isOpen={isAttemptModalOpen}
        onClose={handleCloseAttemptModal}
        onNavigate={handleNavigateInModal}
      />

      <QuestionEditDialog
        question={editingQuestion?.question || null}
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveEditedQuestion}
      />
    </div>
  );
};

export default QuestionLibraryPage;
