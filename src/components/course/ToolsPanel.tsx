
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PanelRight, 
  PanelRightClose,
  StickyNote, 
  MessageSquare, 
  BookOpen, 
  HelpCircle,
  TrendingUp,
  Search,
  Save
} from "lucide-react";

interface GlossaryTerm {
  term: string;
  definition: string;
}

interface ToolsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  courseId: string;
  courseTitle: string;
  currentModuleId?: string;
  glossaryTerms: GlossaryTerm[];
}

export function ToolsPanel({
  isOpen,
  onToggle,
  courseId,
  courseTitle,
  currentModuleId,
  glossaryTerms
}: ToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'ai' | 'glossary' | 'help' | 'progress'>('notes');
  const [notes, setNotes] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [glossarySearch, setGlossarySearch] = useState('');

  const filteredGlossary = glossaryTerms.filter(term =>
    term.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    term.definition.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const TabButton = ({ 
    id, 
    icon: Icon, 
    label, 
    count 
  }: { 
    id: typeof activeTab, 
    icon: any, 
    label: string, 
    count?: number 
  }) => (
    <Button
      variant={activeTab === id ? "default" : "ghost"}
      size="sm"
      onClick={() => setActiveTab(id)}
      className={`w-full justify-start ${
        activeTab === id ? 'bg-indigo-600 text-white' : 'text-gray-600'
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
      {count && <Badge variant="secondary" className="ml-auto">{count}</Badge>}
    </Button>
  );

  if (!isOpen) {
    return (
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
        <Button
          onClick={onToggle}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-l-lg rounded-r-none shadow-lg"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-l border-gray-200 overflow-hidden flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Learning Tools</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Tab Navigation */}
        <div className="space-y-1">
          <TabButton id="notes" icon={StickyNote} label="Notes" />
          <TabButton id="ai" icon={MessageSquare} label="Ask AI" />
          <TabButton id="glossary" icon={BookOpen} label="Glossary" count={glossaryTerms.length} />
          <TabButton id="help" icon={HelpCircle} label="Help" />
          <TabButton id="progress" icon={TrendingUp} label="Progress" />
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Module Notes</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Take notes for this module. They'll be saved automatically.
                </p>
                <Textarea
                  placeholder="Write your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <Button size="sm" className="mt-2 w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
              </div>
              
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Tip:</strong> Notes are saved per module and can be accessed 
                    later for review.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Ask AI Tutor</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Ask questions about the current module or get explanations.
                </p>
                <Textarea
                  placeholder="Ask a question about this module..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <Button size="sm" className="mt-2 w-full bg-purple-600 hover:bg-purple-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ask AI
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Quick Questions:</h4>
                {[
                  "Explain this concept in simpler terms",
                  "Give me a real-world example",
                  "How does this relate to previous modules?",
                  "What are the key takeaways?"
                ].map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start text-xs"
                    onClick={() => setAiQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'glossary' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Course Glossary</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search terms..."
                    value={glossarySearch}
                    onChange={(e) => setGlossarySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredGlossary.map((term, index) => (
                  <Card key={index} className="bg-gray-50 border-gray-200">
                    <CardContent className="p-3">
                      <h4 className="font-semibold text-gray-900 mb-1">{term.term}</h4>
                      <p className="text-sm text-gray-600">{term.definition}</p>
                    </CardContent>
                  </Card>
                ))}
                {filteredGlossary.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No terms found matching your search.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Find answers to common questions or get support.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  "How do I navigate between modules?",
                  "How are my notes saved?",
                  "What happens if I fail a quiz?",
                  "How do I track my progress?",
                  "Can I download content offline?"
                ].map((question, index) => (
                  <Card key={index} className="bg-gray-50 border-gray-200 cursor-pointer hover:bg-gray-100">
                    <CardContent className="p-3">
                      <p className="text-sm text-gray-700">{question}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full">
                <HelpCircle className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Learning Progress</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Track your learning journey and achievements.
                </p>
              </div>

              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">67%</div>
                    <div className="text-sm text-indigo-700">Course Complete</div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Modules Completed</span>
                  <span className="text-sm font-semibold">12/18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Quiz Score</span>
                  <span className="text-sm font-semibold">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Time Spent Learning</span>
                  <span className="text-sm font-semibold">4h 23m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Badges Earned</span>
                  <span className="text-sm font-semibold">3</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
