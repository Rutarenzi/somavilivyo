import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAIConversations, AIConversation } from './useAIConversations';
import { useAIMessages, AIMessage } from './useAIMessages';
import { useChatbot, ResponseLengthPreference } from './useChatbot';
import { toast } from '@/hooks/use-toast';

export function useEnhancedChatbot() {
  const { user } = useAuth();
  const { conversations, createConversation, updateConversation } = useAIConversations();
  const [currentConversation, setCurrentConversation] = useState<AIConversation | null>(null);
  const { messages, addMessage, updateMessage, clearMessages } = useAIMessages(currentConversation?.id || null);
  const { sendMessage: sendAIMessage, isLoading, error } = useChatbot();

  // Auto-generate conversation title from first message
  const generateTitle = (firstMessage: string): string => {
    const words = firstMessage.trim().split(' ').slice(0, 6);
    return words.join(' ') + (words.length >= 6 ? '...' : '');
  };

  // Start a new conversation
  const startNewConversation = async (): Promise<void> => {
    try {
      const newConversation = await createConversation();
      if (newConversation) {
        setCurrentConversation(newConversation);
        clearMessages();
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
  const loadConversation = (conversation: AIConversation): void => {
    setCurrentConversation(conversation);
  };

  // Send message in current conversation
  const sendMessage = async (
    content: string, 
    responseLength: ResponseLengthPreference = 'detailed'
  ): Promise<void> => {
    if (!user || !content.trim()) return;

    let conversation = currentConversation;
    
    // Create new conversation if none exists
    if (!conversation) {
      conversation = await createConversation(generateTitle(content));
      if (!conversation) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }
      setCurrentConversation(conversation);
    }

    try {
      // Add user message to database
      const userMessage = await addMessage('user', content);
      if (!userMessage) throw new Error('Failed to save user message');

      // Update conversation title if it's the first message
      if (conversation.message_count === 0) {
        const newTitle = generateTitle(content);
        await updateConversation(conversation.id, { title: newTitle });
      }

      // Send to AI using existing chatbot hook
      await sendAIMessage(content, responseLength);
      
    } catch (err) {
      console.error('Failed to send message:', err);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Edit a message and regenerate AI response
  const editMessage = async (messageId: string, newContent: string): Promise<void> => {
    if (!currentConversation) return;

    try {
      const success = await updateMessage(messageId, newContent);
      if (!success) {
        throw new Error('Failed to update message');
      }

      // For now, just update the message without regenerating AI response
      // Future enhancement: implement AI response regeneration

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
    // For now, just show feedback
    toast({
      title: "Feedback Received",
      description: `You ${reaction}d the message`,
    });
  };

  // Initialize with most recent conversation if available
  useEffect(() => {
    if (user && conversations.length > 0 && !currentConversation) {
      setCurrentConversation(conversations[0]);
    }
  }, [user, conversations, currentConversation]);

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