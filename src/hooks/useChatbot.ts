import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";
import { FunctionsHttpError, FunctionsRelayError } from '@supabase/functions-js';
import { useAuth } from '@/contexts/AuthContext';

// Define the structure for a quiz question posed by the AI
export interface QuizQuestionPosedByAI {
  question: string;
  options: string[];
  correctAnswerIndex: number; // Index of the correct option in the options array
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  quiz?: QuizQuestionPosedByAI; // Optional: Quiz data associated with an assistant's message
}

export interface CourseContext {
  title?: string;
  topics?: string[];
  currentModuleContent?: string;
}

export type ResponseLengthPreference = 'short' | 'detailed';

interface UseChatbotProps {
  initialMessages?: ChatMessage[];
  courseContext?: CourseContext;
}

export const useChatbot = ({ initialMessages = [], courseContext }: UseChatbotProps = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sendMessage = async (
    userInput: string, 
    responseLengthPreference: ResponseLengthPreference = 'detailed'
  ) => {
    if (!userInput.trim()) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('chatbot-ai', {
        body: { 
          message: userInput,
          courseContext,
          responseLengthPreference,
          userId: user?.id,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (functionError) {
        let detailedMessage = functionError.message; // Default to the generic message
        console.error("Raw functionError from Supabase:", functionError); // Log the raw error for inspection
        
        try {
          if (functionError instanceof FunctionsHttpError && functionError.context && typeof functionError.context.json === 'function') {
            // FunctionsHttpError: context is the Response object
            const errorResponseJson = await functionError.context.json();
            if (errorResponseJson && errorResponseJson.error) {
              detailedMessage = typeof errorResponseJson.error === 'object' ? JSON.stringify(errorResponseJson.error) : String(errorResponseJson.error);
            } else {
              // Fallback if .error is not present but body might still be informative
               detailedMessage = `Error: ${functionError.message}. Response: ${JSON.stringify(errorResponseJson) || functionError.context.statusText || 'No further details.'}`;
            }
          } else if (functionError instanceof FunctionsRelayError && functionError.context && functionError.context.error) {
            // FunctionsRelayError: context is an object like { error: { message, ... } }
             detailedMessage = functionError.context.error.message || detailedMessage;
          } else if (functionError.context && (functionError.context as any).error) {
            // Attempt to access a generic .error property if context is some other object
             const ctxError = (functionError.context as any).error;
             detailedMessage = typeof ctxError === 'string' ? ctxError : JSON.stringify(ctxError);
          }
        } catch (parseError: any) {
          console.warn("Could not parse detailed error from functionError.context:", parseError.message, parseError.stack, functionError.context);
          // Keep detailedMessage as functionError.message or add info about parsing failure
          detailedMessage = `${functionError.message} (Could not parse error details: ${parseError.message})`;
        }
        throw new Error(detailedMessage);
      }
      
      // This checks for an `error` key in the JSON *data* returned by the function if it was a 2xx response
      if (data && data.error) {
        throw new Error(typeof data.error === 'object' ? JSON.stringify(data.error) : String(data.error));
      }

      const aiResponseContent = data.response || "Sorry, I couldn't get a response.";
      const aiQuizData = data.quiz as QuizQuestionPosedByAI | undefined;

      const newAiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
        quiz: aiQuizData,
      };
      setMessages(prev => [...prev, newAiMessage]);

    } catch (e: any) {
      console.error("Chatbot error in useChatbot hook:", e); // Renamed for clarity
      const errorMessage = e.message || "Failed to send message. Please try again.";
      setError(errorMessage);
      toast({
        title: "Chatbot Error",
        description: errorMessage,
        variant: "destructive",
        duration: 7000, // Increased duration for better readability of potentially longer error messages
      });
      const errorSystemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorSystemMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    setMessages, 
  };
};
