
import React from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  selectedText: string;
  onAskAI: () => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, selectedText, onAskAI, onClose }: ContextMenuProps) {
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  // Ensure the menu doesn't go off-screen
  const adjustedX = Math.min(x, window.innerWidth - 150);
  const adjustedY = Math.min(y, window.innerHeight - 80);

  return (
    <div
      className="context-menu fixed z-50 bg-white rounded-lg shadow-lg border p-2 animate-in fade-in-0 zoom-in-95 duration-200"
      style={{
        left: adjustedX,
        top: adjustedY,
      }}
    >
      <Button
        onClick={onAskAI}
        size="sm"
        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Ask AI
      </Button>
      <div className="text-xs text-gray-500 mt-1 max-w-[120px] truncate">
        "{selectedText}"
      </div>
    </div>
  );
}
