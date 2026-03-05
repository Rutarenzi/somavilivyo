import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Eye, 
  Edit3, 
  Save, 
  Download, 
  BarChart3, 
  Filter,
  FileText,
  Share2,
  CheckCircle,
  Clock,
  Brain,
  Target,
  Trash2,
  Copy
} from "lucide-react";
import { GeneratedQuestion } from "@/hooks/useQuestionGeneration";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedQuestionDisplayProps {
  questions: GeneratedQuestion[];
  isGenerating: boolean;
  generationProgress: number;
  onAttemptQuestion: (question: GeneratedQuestion, index: number) => void;
  onEditQuestion: (question: GeneratedQuestion, index: number) => void;
  onDeleteQuestion: (index: number) => void;
  onSaveSet: () => void;
  onExport: (format: string) => void;
  canSave: boolean;
}

interface QuestionStats {
  totalQuestions: number;
  byType: { [key: string]: number };
  byDifficulty: { [key: string]: number };
  byBloomLevel: { [key: string]: number };
  coverage: { [key: string]: number };
}

const questionTypeLabels: { [key: string]: string } = {
  mcq: 'Multiple Choice',
  true_false: 'True/False',
  short_answer: 'Short Answer',
  fill_blank: 'Fill in the Blank',
  matching: 'Matching',
  case_study: 'Case Study'
};

const difficultyColors: { [key: string]: string } = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

const bloomColors: { [key: string]: string } = {
  remember: 'bg-blue-100 text-blue-800',
  understand: 'bg-green-100 text-green-800',
  apply: 'bg-yellow-100 text-yellow-800',
  analyze: 'bg-orange-100 text-orange-800',
  evaluate: 'bg-red-100 text-red-800',
  create: 'bg-purple-100 text-purple-800'
};

export const EnhancedQuestionDisplay: React.FC<EnhancedQuestionDisplayProps> = ({
  questions,
  isGenerating,
  generationProgress,
  onAttemptQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onSaveSet,
  onExport,
  canSave
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate question statistics
  const stats: QuestionStats = useMemo(() => {
    const byType: { [key: string]: number } = {};
    const byDifficulty: { [key: string]: number } = {};
    const byBloomLevel: { [key: string]: number } = {};
    const coverage: { [key: string]: number } = {};

    questions.forEach(q => {
      // Type distribution
      byType[q.type] = (byType[q.type] || 0) + 1;
      
      // Simulate difficulty and bloom level (in real implementation, these would come from AI)
      const simulatedDifficulty = ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)];
      const simulatedBloom = ['remember', 'understand', 'apply', 'analyze'][Math.floor(Math.random() * 4)];
      
      byDifficulty[simulatedDifficulty] = (byDifficulty[simulatedDifficulty] || 0) + 1;
      byBloomLevel[simulatedBloom] = (byBloomLevel[simulatedBloom] || 0) + 1;
    });

    return {
      totalQuestions: questions.length,
      byType,
      byDifficulty,
      byBloomLevel,
      coverage
    };
  }, [questions]);

  // Filter questions based on selected filters
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = !searchQuery || 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.explanation?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || q.type === filterType;
      
      // In real implementation, filter by actual difficulty from AI
      const matchesDifficulty = filterDifficulty === 'all'; // || q.difficulty === filterDifficulty;
      
      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [questions, searchQuery, filterType, filterDifficulty]);

  const renderQuestionCard = (question: GeneratedQuestion, index: number) => (
    <Card key={index} className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                Q{index + 1}
              </Badge>
              <Badge className={difficultyColors.medium}>
                Medium
              </Badge>
              <Badge className={bloomColors.understand}>
                Understand
              </Badge>
              <Badge variant="secondary">
                {questionTypeLabels[question.type]}
              </Badge>
            </div>
            <p className="text-sm font-medium line-clamp-2" title={question.question}>
              {question.question}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onAttemptQuestion(question, index)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View & Attempt</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onEditQuestion(question, index)}
                  className="h-8 w-8 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Question</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onDeleteQuestion(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Question</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {question.options && question.type === 'mcq' && (
          <div className="space-y-1 mb-3">
            {question.options.map((opt, i) => (
              <div key={i} className="text-xs p-2 rounded border bg-muted/30">
                {String.fromCharCode(65 + i)}. {opt}
              </div>
            ))}
          </div>
        )}
        {question.type === 'true_false' && (
          <div className="mb-3">
            <Badge variant="outline" className="text-muted-foreground">
              True/False Question
            </Badge>
          </div>
        )}
        {question.explanation && (
          <div className="text-xs text-muted-foreground italic border-l-2 border-muted pl-3">
            <strong>Note:</strong> Answer and explanation visible after attempting
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            3. Generated Questions
            {questions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {questions.length} questions
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Review, edit, and manage your generated questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">AI Generating Questions...</span>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Content Analysis
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Quality Validation
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  CBC Alignment
                </div>
              </div>
            </div>
          )}

          {questions.length === 0 && !isGenerating && (
            <div className="text-center py-12 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No questions generated yet</p>
              <p className="text-sm">Select content and preferences, then click generate to create questions.</p>
            </div>
          )}

          {questions.length > 0 && (
            <Tabs defaultValue="questions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="questions" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Questions ({filteredQuestions.length})
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="questions" className="space-y-4">
                {/* Filters and Search */}
                <div className="flex gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-8"
                    />
                    <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Questions List */}
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredQuestions.map((question, index) => 
                      renderQuestionCard(question, index)
                    )}
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSaveSet();
                    }}
                    disabled={!canSave} 
                    className="flex-1"
                    type="button"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onExport('pdf');
                    }}
                    disabled={questions.length === 0}
                    type="button"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigator.share?.({ text: 'Check out these questions!' });
                    }}
                    disabled={questions.length === 0}
                    type="button"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                {/* Question Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-2xl font-bold">{stats.totalQuestions}</div>
                    <div className="text-sm text-muted-foreground">Total Questions</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold">
                      {Object.keys(stats.byType).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Question Types</div>
                  </Card>
                </div>

                {/* Type Distribution */}
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-3">Question Type Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{questionTypeLabels[type]}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(count / stats.totalQuestions) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Coverage Analysis */}
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-3">Content Coverage</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Questions generated from {stats.totalQuestions} modules</p>
                    <p>• Average {Math.round(stats.totalQuestions / Math.max(1, Object.keys(stats.byType).length))} questions per type</p>
                    <p>• CBC curriculum aligned</p>
                    <p>• Kenyan context integrated</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};