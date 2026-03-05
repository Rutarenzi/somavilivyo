
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, X, Minimize2, Maximize2 } from "lucide-react";
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from "@/lib/utils";

interface ChatbotProps {
  courseId: string;
  courseTitle: string;
  courseTopics: any[];
  selectedText?: string;
  onTextProcessed?: () => void;
}

export function Chatbot({ 
  courseId, 
  courseTitle, 
  courseTopics, 
  selectedText, 
  onTextProcessed 
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialMessage, setInitialMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { messages, loading, addMessage } = useChatHistory(courseId);

  // Load chat state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`chatbot_state_${courseId}`);
    if (savedState) {
      const { isOpen: savedIsOpen } = JSON.parse(savedState);
      setIsOpen(savedIsOpen);
    }
  }, [courseId]);

  // Save chat state to localStorage
  useEffect(() => {
    localStorage.setItem(
      `chatbot_state_${courseId}`,
      JSON.stringify({ isOpen })
    );
  }, [isOpen, courseId]);

  // Handle selected text
  useEffect(() => {
    if (selectedText && !isOpen) {
      setInitialMessage(`Explain: ${selectedText}`);
      setIsOpen(true);
      onTextProcessed?.();
    }
  }, [selectedText, isOpen, onTextProcessed]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Add user message
      await addMessage(message, false, selectedText);

      // Call AI
      const { data, error } = await supabase.functions.invoke('chatbot-ai', {
        body: {
          message,
          context: selectedText,
          courseTitle,
          courseTopics,
        },
      });

      if (error) throw error;

      // Add AI response
      await addMessage(data.response || 'Sorry, I could not generate a response.', true);
      
    } catch (error) {
      console.error('Error sending message:', error);
      await addMessage('Sorry, I encountered an error. Please try again.', true);
    } finally {
      setIsLoading(false);
      setInitialMessage('');
    }
  };

  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          disabled
          className="bg-gray-400 text-white rounded-full w-14 h-14 shadow-lg"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
        <div className="absolute bottom-full right-0 mb-2 bg-black text-white text-xs p-2 rounded whitespace-nowrap">
          Please sign in to use the chatbot
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <Card className={cn(
          "mb-4 shadow-2xl border-0 overflow-hidden transition-all duration-300",
          isMinimized ? "w-80 h-16" : "w-96 h-[500px]"
        )}>
          <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Course Assistant
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-[436px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center text-gray-500">Loading chat history...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Hi! I'm your course assistant.</p>
                    <p className="text-sm">Ask me anything about this course or select text and click "Ask AI".</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      content={message.content}
                      isBot={message.is_bot}
                      timestamp={new Date(message.created_at)}
                      context={message.context}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                initialValue={initialMessage}
              />
            </CardContent>
          )}
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full w-14 h-14 shadow-lg transition-all duration-300",
          isOpen ? "scale-95" : "scale-100 hover:scale-105"
        )}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
}
