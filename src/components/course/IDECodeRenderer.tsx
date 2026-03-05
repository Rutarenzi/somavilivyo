
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ChevronDown, ChevronRight, FileText, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  comments?: string[];
}

interface IDECodeRendererProps {
  codeBlocks: CodeBlock[];
  title?: string;
}

export function IDECodeRenderer({ codeBlocks, title = "Code Implementation" }: IDECodeRendererProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case 'python':
        return '🐍';
      case 'javascript':
      case 'js':
        return '🟨';
      case 'typescript':
      case 'ts':
        return '🔷';
      case 'html':
        return '🌐';
      case 'css':
        return '🎨';
      default:
        return '📄';
    }
  };

  const getCommentStyle = (language: string) => {
    switch (language.toLowerCase()) {
      case 'python':
        return '#';
      case 'javascript':
      case 'js':
      case 'typescript':
      case 'ts':
        return '//';
      case 'html':
        return '<!--';
      case 'css':
        return '/*';
      default:
        return '#';
    }
  };

  const formatCodeWithLineNumbers = (code: string, language: string) => {
    const lines = code.split('\n');
    const commentPrefix = getCommentStyle(language);
    
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const isComment = line.trim().startsWith(commentPrefix);
      
      return (
        <div key={index} className="flex">
          <span className="text-gray-400 text-xs w-8 flex-shrink-0 text-right pr-2 select-none">
            {lineNumber}
          </span>
          <span className={cn(
            "flex-1",
            isComment && "text-green-400 italic"
          )}>
            {line || '\u00A0'}
          </span>
        </div>
      );
    });
  };

  const copyToClipboard = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (codeBlocks.length === 0) return null;

  return (
    <Card className="border-0 shadow-xl bg-gray-900 text-white overflow-hidden">
      <CardHeader className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Terminal className="h-4 w-4" />
            </div>
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* File Tabs */}
        {isExpanded && codeBlocks.length > 1 && (
          <div className="flex gap-1 mt-3">
            {codeBlocks.map((block, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-t-lg flex items-center gap-2 transition-colors",
                  activeTab === index
                    ? "bg-gray-900 text-white border-t border-l border-r border-gray-600"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                )}
              >
                <span>{getLanguageIcon(block.language)}</span>
                <span>{block.filename || `${block.language}.${block.language}`}</span>
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {codeBlocks.map((block, index) => (
            <div
              key={index}
              className={cn(
                "relative",
                codeBlocks.length > 1 && activeTab !== index && "hidden"
              )}
            >
              {/* Code Header */}
              <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {block.filename || `example.${block.language}`}
                  </span>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                    {block.language.toUpperCase()}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(block.code, index)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 h-8"
                >
                  <Copy className="h-3 w-3" />
                  {copiedIndex === index ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              {/* Code Content */}
              <div className="p-4 bg-gray-900 overflow-x-auto">
                <pre className="text-sm font-mono leading-relaxed">
                  <code className="text-gray-100">
                    {formatCodeWithLineNumbers(block.code, block.language)}
                  </code>
                </pre>
              </div>

              {/* Comments Section */}
              {block.comments && block.comments.length > 0 && (
                <div className="bg-gray-800 border-t border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">💡 Code Explanation:</h4>
                  <ul className="space-y-1">
                    {block.comments.map((comment, commentIndex) => (
                      <li key={commentIndex} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{comment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
