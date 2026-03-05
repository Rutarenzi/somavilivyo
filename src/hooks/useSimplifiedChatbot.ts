import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAIConversations, AIConversation } from './useAIConversations';
import { useAIMessages, AIMessage } from './useAIMessages';
import { useCleanupEmptyConversations } from './useCleanupEmptyConversations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useSimplifiedChatbot() {
  const { user } = useAuth();
  const { conversations, createConversation, updateConversation } = useAIConversations();
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const { messages, addMessage, updateMessage, clearMessages, refreshMessages } = useAIMessages(currentConversation?.id || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [conversationCreationPromise, setConversationCreationPromise] = useState<Promise<AIConversation | null> | null>(null);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // Enable cleanup of empty conversations
  useCleanupEmptyConversations();

  // Generate conversation title from first message
  const generateTitle = (firstMessage: string): string => {
    const words = firstMessage.trim().split(' ').slice(0, 8);
    let title = words.join(' ');
    if (words.length >= 8) title += '...';
    // Clean up and capitalize
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title.length > 50 ? title.slice(0, 47) + '...' : title;
  };

  // Generate AI-powered smart title
  const generateSmartTitle = async (conversationMessages: string[]): Promise<string> => {
    try {
      const conversationContext = conversationMessages.slice(0, 4).join('\n\n');
      const { data, error } = await supabase.functions.invoke('chatbot-ai', {
        body: {
          message: `Based on this conversation, generate a short, descriptive title (max 6 words):\n\n${conversationContext}`,
          responseLengthPreference: 'short'
        }
      });

      if (error) throw error;
      
      if (data && data.response) {
        const title = data.response.trim().replace(/^["']|["']$/g, ''); // Remove quotes
        return title.length > 50 ? title.slice(0, 47) + '...' : title;
      }
    } catch (err) {
      console.error('Error generating smart title:', err);
    }
    
    // Fallback to simple title
    return generateTitle(conversationMessages[0] || 'New Conversation');
  };

  // Start a new conversation
  const startNewConversation = async (): Promise<void> => {
    if (isCreatingConversation || conversationCreationPromise) {
      console.log('Already creating a conversation, skipping new conversation request');
      return;
    }

    try {
      console.log('Starting new conversation...');
      const newConversation = await createConversation();
      if (newConversation) {
        setCurrentConversation(newConversation);
        clearMessages();
        console.log('New conversation created:', newConversation.id);
      }
    } catch (err) {
      console.error('Failed to start new conversation:', err);
      toast({
        title: "Error",
        description: "Failed to start new conversation",
        variant: "destructive",
      });
    }
  };

  // Load existing conversation
  const loadConversation = async (conversation: AIConversation): Promise<void> => {
    console.log('Loading conversation:', conversation.id, conversation.title);
    setCurrentConversation(conversation);
    // Clear any existing messages first to show loading state
    clearMessages();
    // Explicitly refresh messages for the selected conversation
    if (conversation.id) {
      await refreshMessages();
    }
  };

  // Generate AI response with conversation context
  const generateAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Get recent conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chatbot-ai', {
        body: {
          message: userMessage,
          conversationHistory: conversationHistory,
          responseLengthPreference: 'detailed'
        }
      });

      if (error) throw error;
      
      // Extract the AI response from the data
      if (data && data.response) {
        return data.response;
      }
      
      return "I received your message: " + userMessage + ". This is a placeholder response until the AI integration is complete.";
    } catch (err) {
      console.error('AI response error:', err);
      return "I'm sorry, I'm having trouble responding right now. Please try again.";
    }
  };

  // Send message in current conversation
  const sendMessage = async (content: string): Promise<void> => {
    if (!user || !content.trim()) return;

    // Prevent multiple simultaneous operations
    if (isLoading) {
      console.log('Already processing a message, skipping...');
      return;
    }

    setIsLoading(true);
    setError(null);

    let conversation = currentConversation;
    
    try {
      // Handle conversation creation with proper race condition prevention
      if (!conversation) {
        console.log('No current conversation, need to create one');
        
        // Check if we're already creating a conversation
        if (conversationCreationPromise) {
          console.log('Already creating conversation, waiting...');
          conversation = await conversationCreationPromise;
        } else if (!isCreatingConversation) {
          console.log('Starting new conversation creation');
          setIsCreatingConversation(true);
          
          const creationPromise = createConversation('New Conversation');
          setConversationCreationPromise(creationPromise);
          
          try {
            conversation = await creationPromise;
            if (conversation) {
              console.log('Successfully created conversation:', conversation.id);
              setCurrentConversation(conversation);
            }
          } finally {
            setIsCreatingConversation(false);
            setConversationCreationPromise(null);
          }
        } else {
          // Wait for the ongoing creation to complete
          console.log('Waiting for ongoing conversation creation...');
          return;
        }
      }

      // If we still don't have a conversation, something went wrong
      if (!conversation) {
        throw new Error('No conversation available');
      }

      console.log('Adding user message to conversation:', conversation.id);
      // Add user message to database
      const userMessage = await addMessage('user', content);
      if (!userMessage) throw new Error('Failed to save user message');

      console.log('Generating AI response...');
      // Generate AI response
      const aiResponse = await generateAIResponse(content);
      
      console.log('Adding AI response to database...');
      // Add AI response to database  
      const aiMessage = await addMessage('assistant', aiResponse);
      if (!aiMessage) throw new Error('Failed to save AI response');

      // Update conversation title if it's still "New Conversation" and has messages
      if (conversation.title === 'New Conversation') {
        console.log('Updating conversation title for:', conversation.id);
        try {
          const smartTitle = await generateSmartTitle([content, aiResponse]);
          console.log('Generated smart title:', smartTitle);
          const success = await updateConversation(conversation.id, { title: smartTitle });
          if (success) {
            // Update local conversation object
            setCurrentConversation(prev => prev ? { ...prev, title: smartTitle } : prev);
            console.log('Title successfully updated to:', smartTitle);
          }
        } catch (titleError) {
          console.warn('Smart title generation failed, using simple title:', titleError);
          const simpleTitle = generateTitle(content);
          console.log('Generated simple title:', simpleTitle);
          const success = await updateConversation(conversation.id, { title: simpleTitle });
          if (success) {
            // Update local conversation object
            setCurrentConversation(prev => prev ? { ...prev, title: simpleTitle } : prev);
            console.log('Simple title successfully updated to:', simpleTitle);
          }
        }
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      toast({
        title: "Error", 
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Edit a message
  const editMessage = async (messageId: string, newContent: string): Promise<void> => {
    if (!currentConversation) return;

    try {
      const success = await updateMessage(messageId, newContent);
      if (!success) {
        throw new Error('Failed to update message');
      }

      toast({
        title: "Message Updated",
        description: "Your message has been updated successfully.",
      });
    } catch (err) {
      console.error('Failed to edit message:', err);
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  };

  // Copy message to clipboard
  const copyMessage = (content: string): void => {
    navigator.clipboard.writeText(content).then(() => {
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    });
  };

  // React to a message
  const reactToMessage = (messageId: string, reaction: 'like' | 'dislike'): void => {
    toast({
      title: "Feedback Received",
      description: `You ${reaction}d the message`,
    });
  };

  // Title backfill: Generate titles for "New Conversation" with messages
  useEffect(() => {
    if (currentConversation && 
        currentConversation.title === "New Conversation" && 
        messages.length >= 2 &&
        !isGeneratingTitle) {
      
      setIsGeneratingTitle(true);
      
      // Generate title from first user and assistant messages
      const firstUserMsg = messages.find(m => m.role === 'user')?.content || '';
      const firstAssistantMsg = messages.find(m => m.role === 'assistant')?.content || '';
      
      generateSmartTitle([firstUserMsg, firstAssistantMsg])
        .then(async (title) => {
          if (title && title !== "New Conversation") {
            const success = await updateConversation(currentConversation.id, { title });
            if (success) {
              setCurrentConversation(prev => prev ? { ...prev, title } : null);
              console.log('Backfill title successfully updated to:', title);
            }
          }
        })
        .catch(error => {
          console.error('Error generating title:', error);
        })
        .finally(() => {
          setIsGeneratingTitle(false);
        });
    }
  }, [currentConversation, messages, isGeneratingTitle, updateConversation]);

  // Initialize with most recent conversation if available
  useEffect(() => {
    if (user && conversations.length > 0 && !currentConversation && !isCreatingConversation) {
      // Find the most recent conversation with messages, or the most recent overall
      const conversationWithMessages = conversations.find(conv => conv.message_count > 0);
      const targetConversation = conversationWithMessages || conversations[0];
      
      console.log('Auto-selecting conversation:', targetConversation.id, 'with', targetConversation.message_count, 'messages');
      setCurrentConversation(targetConversation);
    }
  }, [user, conversations, currentConversation, isCreatingConversation]);

  return {
    // Conversation management
    conversations,
    currentConversation,
    startNewConversation,
    loadConversation,
    
    // Messages
    messages,
    isLoading,
    error,
    sendMessage,
    editMessage,
    copyMessage,
    reactToMessage,
    
    // State
    isAuthenticated: !!user,
  };
}