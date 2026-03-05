import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AIMessage } from '@/hooks/useAIMessages';

interface MessageEditDialogProps {
  message: AIMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (messageId: string, newContent: string) => Promise<void>;
}

export function MessageEditDialog({
  message,
  isOpen,
  onClose,
  onSave
}: MessageEditDialogProps) {
  const [content, setContent] = useState(message?.content || '');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (message) {
      setContent(message.content);
    }
  }, [message]);

  const handleSave = async () => {
    if (!message || !content.trim()) return;

    setIsLoading(true);
    try {
      await onSave(message.id, content.trim());
      onClose();
    } catch (error) {
      console.error('Failed to save message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setContent(message?.content || '');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>
            Make changes to your message. The AI will regenerate its response based on your edits.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your message..."
            className="min-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleSave();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !content.trim() || content === message?.content}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}