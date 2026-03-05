import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Brain, Target, Settings, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface EnhancedQuestionPreferences {
  questionCount: number;
  questionTypes: string[];
  difficulty: string;
  adaptiveDifficulty: boolean;
  bloomLevels: string[];
  focusAreas: string[];
  customInstructions: string;
}

interface EnhancedQuestionPreferencesProps {
  preferences: EnhancedQuestionPreferences;
  onChange: (preferences: EnhancedQuestionPreferences) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
  selectedModulesCount: number;
  totalQuestionsToGenerate: number;
}

const questionTypes = [
  { value: 'mcq', label: 'Multiple Choice', description: 'Traditional 4-option questions' },
  { value: 'true_false', label: 'True/False', description: 'Simple binary questions' },
  { value: 'short_answer', label: 'Short Answer', description: 'Brief text responses' },
  { value: 'fill_blank', label: 'Fill in the Blank', description: 'Complete the sentence' },
  { value: 'matching', label: 'Matching', description: 'Connect related items' },
  { value: 'case_study', label: 'Case Study', description: 'Scenario-based analysis' }
];

const bloomLevels = [
  { value: 'remember', label: 'Remember', color: 'bg-blue-100 text-blue-800', description: 'Recall facts and basic concepts' },
  { value: 'understand', label: 'Understand', color: 'bg-green-100 text-green-800', description: 'Explain ideas or concepts' },
  { value: 'apply', label: 'Apply', color: 'bg-yellow-100 text-yellow-800', description: 'Use information in new situations' },
  { value: 'analyze', label: 'Analyze', color: 'bg-orange-100 text-orange-800', description: 'Draw connections among ideas' },
  { value: 'evaluate', label: 'Evaluate', color: 'bg-red-100 text-red-800', description: 'Justify a stand or decision' },
  { value: 'create', label: 'Create', color: 'bg-purple-100 text-purple-800', description: 'Produce new or original work' }
];

export const EnhancedQuestionPreferences: React.FC<EnhancedQuestionPreferencesProps> = ({
  preferences,
  onChange,
  onGenerate,
  isGenerating,
  disabled,
  selectedModulesCount,
  totalQuestionsToGenerate
}) => {
  const updatePreference = (key: keyof EnhancedQuestionPreferences, value: any) => {
    onChange({ ...preferences, [key]: value });
  };

  const toggleQuestionType = (type: string) => {
    const newTypes = preferences.questionTypes.includes(type)
      ? preferences.questionTypes.filter(t => t !== type)
      : [...preferences.questionTypes, type];
    updatePreference('questionTypes', newTypes);
  };

  const toggleBloomLevel = (level: string) => {
    const newLevels = preferences.bloomLevels.includes(level)
      ? preferences.bloomLevels.filter(l => l !== level)
      : [...preferences.bloomLevels, level];
    updatePreference('bloomLevels', newLevels);
  };

  return (
    <TooltipProvider>
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            2. Set Preferences
          </CardTitle>
          <CardDescription>Customize the type and difficulty of questions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="bloom">Bloom's</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Question Count */}
              <div className="space-y-2">
                <Label htmlFor="question-count" className="flex items-center gap-2">
                  Questions Per Module
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Number of questions to generate for each selected module</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="question-count"
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.questionCount}
                    onChange={(e) => updatePreference('questionCount', parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    Total: {totalQuestionsToGenerate} questions
                  </span>
                </div>
              </div>

              {/* Adaptive Difficulty */}
              <div className="flex items-center justify-between">
                <Label htmlFor="adaptive-difficulty" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Adaptive Difficulty
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI adjusts question difficulty based on user performance</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="adaptive-difficulty"
                  checked={preferences.adaptiveDifficulty}
                  onCheckedChange={(checked) => updatePreference('adaptiveDifficulty', checked)}
                />
              </div>

              {/* Fixed Difficulty (when adaptive is off) */}
              {!preferences.adaptiveDifficulty && (
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={preferences.difficulty}
                    onValueChange={(val) => updatePreference('difficulty', val)}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy - Basic recall and understanding</SelectItem>
                      <SelectItem value="medium">Medium - Application and analysis</SelectItem>
                      <SelectItem value="hard">Hard - Evaluation and creation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Question Types */}
              <div className="space-y-3">
                <Label>Question Types</Label>
                <div className="grid grid-cols-1 gap-2">
                  {questionTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={preferences.questionTypes.includes(type.value)}
                        onCheckedChange={() => toggleQuestionType(type.value)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`type-${type.value}`} className="font-medium cursor-pointer">
                          {type.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {preferences.questionTypes.length === 0 && (
                  <p className="text-sm text-red-600">Please select at least one question type</p>
                )}
              </div>

              {/* Custom Instructions */}
              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
                <textarea
                  id="custom-instructions"
                  placeholder="Additional instructions for question generation..."
                  value={preferences.customInstructions}
                  onChange={(e) => updatePreference('customInstructions', e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                />
              </div>
            </TabsContent>

            <TabsContent value="bloom" className="space-y-4">
              {/* Bloom's Taxonomy Levels */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Bloom's Taxonomy Levels
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select cognitive levels for question complexity</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <div className="grid grid-cols-1 gap-2">
                  {bloomLevels.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`bloom-${level.value}`}
                        checked={preferences.bloomLevels.includes(level.value)}
                        onCheckedChange={() => toggleBloomLevel(level.value)}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <Label htmlFor={`bloom-${level.value}`} className="font-medium cursor-pointer">
                            {level.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{level.description}</p>
                        </div>
                        <Badge className={level.color}>{level.label}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {preferences.bloomLevels.length === 0 && (
                  <p className="text-sm text-red-600">Please select at least one cognitive level</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Generating Questions...</Label>
                <span className="text-xs text-muted-foreground">AI at work</span>
              </div>
              <Progress value={33} className="w-full" />
              <p className="text-xs text-muted-foreground">Creating {totalQuestionsToGenerate} high-quality questions</p>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={onGenerate} 
            disabled={disabled || isGenerating || preferences.questionTypes.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? 'Generating Questions...' : `Generate ${totalQuestionsToGenerate} Questions`}
          </Button>

          {/* Smart Defaults Info */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
            <p className="font-medium mb-1">💡 Smart Defaults Applied:</p>
            <ul className="space-y-1">
              <li>• Medium difficulty with Kenyan context</li>
              <li>• CBC curriculum aligned</li>
              <li>• Quality validation enabled</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};