import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  RotateCcw,
  Trash2,
  Eye,
  Download,
  Filter
} from "lucide-react";
import { GeneratedQuestion } from "@/hooks/useQuestionGeneration";
import { useLocalStorage } from "@/hooks/use-localStorage";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuestionHistoryItem {
  id: string;
  questions: GeneratedQuestion[];
  courseTitle: string;
  moduleNames: string[];
  generatedAt: string;
  preferences: any;
  feedback?: 'positive' | 'negative';
  rating?: number;
  saved: boolean;
  usageCount: number;
}

interface QuestionHistoryManagerProps {
  onRestoreSession: (historyItem: QuestionHistoryItem) => void;
  onDeleteSession: (sessionId: string) => void;
  currentSession?: {
    questions: GeneratedQuestion[];
    courseTitle: string;
    moduleNames: string[];
    preferences: any;
  };
}

export const QuestionHistoryManager: React.FC<QuestionHistoryManagerProps> = ({
  onRestoreSession,
  onDeleteSession,
  currentSession
}) => {
  const [history, setHistory] = useLocalStorage<QuestionHistoryItem[]>('question-generation-history', []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeedback, setFilterFeedback] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'usage'>('date');

  // Save current session to history
  useEffect(() => {
    if (currentSession && currentSession.questions.length > 0) {
      const sessionId = `session-${Date.now()}`;
      const newHistoryItem: QuestionHistoryItem = {
        id: sessionId,
        questions: currentSession.questions,
        courseTitle: currentSession.courseTitle,
        moduleNames: currentSession.moduleNames,
        generatedAt: new Date().toISOString(),
        preferences: currentSession.preferences,
        saved: false,
        usageCount: 0
      };

      setHistory(prev => {
        // Remove older sessions if we have too many (keep last 50)
        const filtered = prev.filter(item => item.saved || prev.length < 50);
        return [newHistoryItem, ...filtered];
      });
    }
  }, [currentSession, setHistory]);

  const updateFeedback = (sessionId: string, feedback: 'positive' | 'negative') => {
    setHistory(prev => prev.map(item => 
      item.id === sessionId ? { ...item, feedback } : item
    ));
  };

  const updateRating = (sessionId: string, rating: number) => {
    setHistory(prev => prev.map(item => 
      item.id === sessionId ? { ...item, rating } : item
    ));
  };

  const markAsSaved = (sessionId: string) => {
    setHistory(prev => prev.map(item => 
      item.id === sessionId ? { ...item, saved: true } : item
    ));
  };

  const incrementUsage = (sessionId: string) => {
    setHistory(prev => prev.map(item => 
      item.id === sessionId ? { ...item, usageCount: item.usageCount + 1 } : item
    ));
  };

  const deleteSession = (sessionId: string) => {
    setHistory(prev => prev.filter(item => item.id !== sessionId));
    onDeleteSession(sessionId);
  };

  const restoreSession = (historyItem: QuestionHistoryItem) => {
    incrementUsage(historyItem.id);
    onRestoreSession(historyItem);
  };

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = !searchQuery || 
        item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.moduleNames.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFeedback = filterFeedback === 'all' || item.feedback === filterFeedback;
      
      return matchesSearch && matchesFeedback;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'date':
        default:
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      }
    });

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Question History
          </CardTitle>
          <CardDescription>
            Review and restore previous question generation sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="recent" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterFeedback} onValueChange={setFilterFeedback}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="positive">Liked</SelectItem>
                    <SelectItem value="negative">Disliked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy as any}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="usage">Usage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* History List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No generation history found</p>
                    </div>
                  ) : (
                    filteredHistory.map((item) => (
                      <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm truncate">{item.courseTitle}</h4>
                              {item.saved && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Saved
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>{item.questions.length} questions from {item.moduleNames.length} modules</p>
                              <p>{getRelativeTime(item.generatedAt)}</p>
                              {item.usageCount > 0 && (
                                <p>Used {item.usageCount} times</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-2">
                              {item.moduleNames.slice(0, 2).map((name, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {name.slice(0, 20)}...
                                </Badge>
                              ))}
                              {item.moduleNames.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{item.moduleNames.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => restoreSession(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restore Session</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateFeedback(item.id, item.feedback === 'positive' ? undefined : 'positive')}
                                  className={cn(
                                    "h-8 w-8 p-0",
                                    item.feedback === 'positive' && "text-green-600"
                                  )}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Like</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateFeedback(item.id, item.feedback === 'negative' ? undefined : 'negative')}
                                  className={cn(
                                    "h-8 w-8 p-0",
                                    item.feedback === 'negative' && "text-red-600"
                                  )}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Dislike</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSession(item.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="saved" className="space-y-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {history.filter(item => item.saved).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No saved sessions found</p>
                    </div>
                  ) : (
                    history.filter(item => item.saved).map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{item.courseTitle}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.questions.length} questions • {getRelativeTime(item.generatedAt)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreSession(item)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{history.length}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {history.reduce((acc, item) => acc + item.questions.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Questions Generated</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {history.filter(item => item.feedback === 'positive').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Liked Sessions</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {Math.round(history.reduce((acc, item) => acc + (item.rating || 0), 0) / Math.max(1, history.length))}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Rating</div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
