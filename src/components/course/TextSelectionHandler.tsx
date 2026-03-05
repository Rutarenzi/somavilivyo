
import React, { useState } from 'react';
import { ContextMenu } from './ContextMenu';

interface TextSelectionHandlerProps {
  children: React.ReactNode;
  onTextSelected: (text: string) => void;
}

export function TextSelectionHandler({ children, onTextSelected }: TextSelectionHandlerProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText: string;
  } | null>(null);

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 3) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        setContextMenu({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 5,
          selectedText,
        });
      }
    } else {
      setContextMenu(null);
    }
  };

  const handleAskAI = () => {
    if (contextMenu) {
      onTextSelected(contextMenu.selectedText);
      setContextMenu(null);
      // Clear selection
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div onMouseUp={handleMouseUp} className="relative">
      {children}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          selectedText={contextMenu.selectedText}
          onAskAI={handleAskAI}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
