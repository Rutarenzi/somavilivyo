
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Clock, CheckCircle2 } from "lucide-react";

interface StreamingContentRendererProps {
  content: string;
  title: string;
  learningObjective: string;
  estimatedMinutes: number;
  isCompleted?: boolean;
}

export function StreamingContentRenderer({
  content,
  title,
  learningObjective,
  estimatedMinutes,
  isCompleted = false
}: StreamingContentRendererProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Simulate content streaming for better perceived performance
  useEffect(() => {
    if (!content) return;

    const words = content.split(' ');
    let currentIndex = 0;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedContent(prev => prev + (prev ? ' ' : '') + words[currentIndex]);
        currentIndex++;
        
        // Update progress
        setReadingProgress((currentIndex / words.length) * 100);
      } else {
        setIsStreaming(false);
        clearInterval(streamInterval);
      }
    }, 50); // Stream at 50ms intervals for smooth appearance

    return () => clearInterval(streamInterval);
  }, [content]);

  // Track scroll progress for reading analytics
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      
      // You could send this to analytics here
      console.log(`Reading progress: ${Math.round(progress)}%`);
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Learning Objective Card */}
      <Card className="border-l-4 border-l-indigo-500 bg-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-indigo-800">
            <Target className="h-5 w-5" />
            <span>Learning Objective</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-indigo-700 font-medium">{learningObjective}</p>
        </CardContent>
      </Card>

      {/* Module Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{estimatedMinutes} min read</span>
          </div>
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Streaming Progress Bar */}
      {isStreaming && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6">
          <div 
            ref={contentRef}
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
            style={{ maxHeight: '600px', overflowY: 'auto' }}
          >
            <div dangerouslySetInnerHTML={{ __html: displayedContent }} />
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-indigo-600 animate-pulse ml-1" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reading Analytics (Hidden but tracking) */}
      <div className="hidden">
        <div data-analytics="content-view" data-module-id={title} />
        <div data-analytics="reading-time" data-estimated={estimatedMinutes} />
      </div>
    </div>
  );
}
