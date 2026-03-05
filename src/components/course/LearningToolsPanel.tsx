
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Search,
  Brain,
  Lightbulb
} from "lucide-react";
import { Chatbot } from "./Chatbot";

interface LearningToolsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  courseId: string;
  courseTitle: string;
  currentModuleId?: string;
  glossaryTerms?: Array<{
    term: string;
    definition: string;
  }>;
}

export function LearningToolsPanel({
  isOpen,
  onToggle,
  courseId,
  courseTitle,
  currentModuleId,
  glossaryTerms = []
}: LearningToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'chat' | 'glossary' | 'help'>('notes');
  const [notes, setNotes] = useState('');
  const [showChat, setShowChat] = useState(false);

  const tabs = [
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'chat', label: 'AI Help', icon: MessageSquare },
    { id: 'glossary', label: 'Glossary', icon: BookOpen },
    { id: 'help', label: 'Help', icon: HelpCircle }
  ];

  const helpTips = [
    {
      title: "Stuck on a concept?",
      content: "Use the AI chat to get personalized explanations and examples.",
      icon: Brain
    },
    {
      title: "Taking effective notes",
      content: "Write key insights and personal connections as you learn.",
      icon: StickyNote
    },
    {
      title: "Using the glossary",
      content: "Quick definitions for technical terms and concepts.",
      icon: BookOpen
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'notes':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-3">
              Module notes are auto-saved as you type
            </div>
            <Textarea
              placeholder="Write your thoughts, insights, and questions here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{notes.length} characters</span>
              <span>Auto-saved</span>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Ask anything about this course or module
            </div>
            <Button
              onClick={() => setShowChat(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Open AI Assistant
            </Button>
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Quick Questions:</div>
              {[
                "Explain this concept simply",
                "Give me a real-world example",
                "What should I focus on?",
                "How does this apply to my work?"
              ].map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => setShowChat(true)}
                >
                  <Lightbulb className="h-3 w-3 mr-2 text-yellow-500" />
                  {question}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'glossary':
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search terms..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {glossaryTerms.length > 0 ? (
                  glossaryTerms.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {item.term}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.definition}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <div className="text-sm">No glossary terms available</div>
                    <div className="text-xs mt-1">Terms will appear as you progress</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 'help':
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Tips to enhance your learning experience
            </div>
            <div className="space-y-3">
              {helpTips.map((tip, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <tip.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {tip.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tip.content}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <Button variant="outline" size="sm" className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white shadow-lg"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Panel */}
      <div className={`
        fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Learning Tools</h3>
              <Badge variant="secondary" className="text-xs">
                Module {currentModuleId || '1'}
              </Badge>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className={`flex-1 text-xs ${
                    activeTab === tab.id 
                      ? 'bg-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  <tab.icon className="h-3 w-3 mr-1" />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              {renderTabContent()}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* AI Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">AI Learning Assistant</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
                ×
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Chatbot
                courseId={courseId}
                courseTitle={courseTitle}
                courseTopics={[]}
                onTextProcessed={() => {}}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
