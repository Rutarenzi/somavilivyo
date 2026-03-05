import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, MessageCircle, X, CornerDownLeft, ChevronsUpDown } from 'lucide-react';
import { useChatbot, ChatMessage, CourseContext, ResponseLengthPreference, QuizQuestionPosedByAI } from '@/hooks/useChatbot';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { GamifiedQuiz } from './GamifiedQuiz';
import { StaticQuizView } from './StaticQuizView';
import ReactMarkdown from 'react-markdown';

interface FloatingChatbotProps {
  courseContext?: CourseContext;
}

export default function FloatingChatbot({ courseContext }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, sendMessage } = useChatbot({ courseContext });
  const [inputValue, setInputValue] = useState('');
  const [responseLength, setResponseLength] = useState<ResponseLengthPreference>('short');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State to track answered quizzes by message ID
  const [answeredQuizzes, setAnsweredQuizzes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue, responseLength);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuizComplete = (messageId: string) => {
    setAnsweredQuizzes(prev => ({ ...prev, [messageId]: true }));
    // GamifiedQuiz will show its own explanation.
    // Subsequent renders will use StaticQuizView for this messageId.
  };
  
  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full gradient-primary shadow-xl animate-bounce hover:animate-none z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Chatbot"
      >
        <MessageCircle className="h-8 w-8" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-[380px] h-[550px] flex flex-col shadow-2xl glass bg-white/90 backdrop-blur-xl border-gray-200/60 overflow-hidden rounded-2xl">
        <CardHeader className="py-3 px-4 border-b border-gray-200/50 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6" />
              <CardTitle className="text-lg font-semibold">AI Course Helper</CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Select value={responseLength} onValueChange={(value) => setResponseLength(value as ResponseLengthPreference)}>
                  <SelectTrigger 
                    className="w-auto h-7 text-xs px-2 py-1 bg-white/20 hover:bg-white/30 text-white border-white/30 focus:ring-white"
                    aria-label="Response Style"
                  >
                    <SelectValue /> <ChevronsUpDown className="w-3 h-3 ml-1 opacity-70"/>
                  </SelectTrigger>
                  <SelectContent className="min-w-[100px]">
                    <SelectItem value="short" className="text-xs">Quick</SelectItem>
                    <SelectItem value="detailed" className="text-xs">Detailed</SelectItem>
                  </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Close chat</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-3 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-gray-500 py-8 px-4">
                  Hi there! How can I help you with {courseContext?.title || "this course"} today?
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start space-x-2.5 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse space-x-reverse" : ""
                  )}
                >
                  <Avatar className="mt-0.5 h-7 w-7 flex-shrink-0">
                    <AvatarFallback 
                      className={cn(
                        "text-xs",
                        msg.role === 'user' ? "bg-indigo-500 text-white" : "bg-purple-500 text-white"
                      )}
                  >
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "p-2.5 rounded-lg shadow text-sm break-words w-full",
                      msg.role === 'user'
                        ? "bg-indigo-500 text-white rounded-tr-none"
                        : "bg-white text-gray-800 rounded-tl-none border border-gray-200",
                       msg.role === 'system' && "bg-yellow-50 border-yellow-200 text-yellow-700 text-xs italic w-full text-center"
                    )}
                  >
                     {msg.role === 'system' ? (
                       msg.content
                      ) : msg.role === 'assistant' ? (
                       <div className="prose prose-sm max-w-none 
                         prose-headings:text-gray-900 prose-headings:font-semibold prose-headings:mb-2
                         prose-p:text-gray-800 prose-p:leading-relaxed prose-p:mb-3
                         prose-strong:text-gray-900 prose-strong:font-semibold
                         prose-em:text-gray-700 prose-em:italic
                         prose-ul:my-2 prose-ul:list-disc prose-ul:pl-4 prose-ul:space-y-1
                         prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-4 prose-ol:space-y-1
                         prose-li:text-gray-800 prose-li:leading-relaxed
                         prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                         prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-3 prose-pre:overflow-x-auto
                         prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:my-3
                         prose-a:text-indigo-600 prose-a:underline prose-a:font-medium">
                         <ReactMarkdown
                           components={{
                             a: ({ node, ...props }) => (
                               <a {...props} className="text-indigo-600 hover:text-indigo-700 transition-colors" target="_blank" rel="noopener noreferrer" />
                             ),
                             code: ({ node, className, children, ...props }) => {
                               const match = /language-(\w+)/.exec(className || '');
                               return match ? (
                                 <code className={cn(className, "block bg-gray-100 p-3 rounded-lg text-xs overflow-x-auto font-mono leading-relaxed")} {...props}>
                                   {children}
                                 </code>
                               ) : (
                                 <code className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                   {children}
                                 </code>
                               );
                             },
                             p: ({ node, ...props }) => (
                               <p {...props} className="mb-3 leading-relaxed" />
                             ),
                             ul: ({ node, ...props }) => (
                               <ul {...props} className="my-2 space-y-1.5 list-disc pl-4" />
                             ),
                             ol: ({ node, ...props }) => (
                               <ol {...props} className="my-2 space-y-1.5 list-decimal pl-4" />
                             ),
                             li: ({ node, ...props }) => (
                               <li {...props} className="leading-relaxed" />
                             ),
                             blockquote: ({ node, ...props }) => (
                               <blockquote {...props} className="border-l-4 border-indigo-400 pl-4 italic my-3 text-gray-700" />
                             ),
                           }}
                         >
                           {msg.content}
                         </ReactMarkdown>
                       </div>
                     ) : (
                       msg.content
                     )}
                    {/* Quiz rendering logic */}
                    {msg.role === 'assistant' && msg.quiz && (
                      <div className="mt-2">
                        {!answeredQuizzes[msg.id] ? (
                          <GamifiedQuiz
                            quiz={{
                              question: msg.quiz.question,
                              options: msg.quiz.options,
                              correct: msg.quiz.correctAnswerIndex,
                              explanation: msg.quiz.explanation,
                            }}
                            onComplete={(_score) => handleQuizComplete(msg.id)}
                            // onNext is optional for GamifiedQuiz, not using it here
                          />
                        ) : (
                          <StaticQuizView quiz={msg.quiz} />
                        )}
                      </div>
                    )}
                    {/* Timestamp (moved outside conditional quiz rendering if quiz is present) */}
                    {!(msg.role === 'assistant' && msg.quiz && !answeredQuizzes[msg.id]) && (
                       <p className="text-xs opacity-60 mt-1 text-right">
                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start space-x-2.5">
                  <Avatar className="mt-0.5 h-7 w-7"><AvatarFallback className="text-xs bg-purple-500 text-white">AI</AvatarFallback></Avatar>
                  <div className="p-2.5 rounded-lg shadow bg-white text-gray-800 border border-gray-200">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-3 border-t border-gray-200/50">
          <div className="flex w-full items-center space-x-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask about this course..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 h-10 text-sm glass bg-white/80 focus-visible:ring-indigo-500 border-gray-300/80"
              disabled={isLoading}
              aria-label="Chat input"
            />
            <Button onClick={handleSend} disabled={isLoading || !inputValue.trim()} className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700">
              <CornerDownLeft className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
