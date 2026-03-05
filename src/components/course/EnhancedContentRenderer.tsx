
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Lightbulb, BookOpen, Code, List, Quote, Shield } from "lucide-react";
import { parseHTMLContent, ContentSection } from "@/utils/enhancedContentParser";
import { SecurityUtils } from '@/utils/securityUtils';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { ContentQualityValidator } from '@/utils/contentQualityValidator';
import { cn } from "@/lib/utils";

interface EnhancedContentRendererProps {
  content: string;
  title?: string;
  learningObjective?: string;
  className?: string;
  moduleId?: string;
  courseId?: string;
  quiz?: any;
}

export function EnhancedContentRenderer({ 
  content, 
  title, 
  learningObjective, 
  className,
  moduleId,
  courseId,
  quiz
}: EnhancedContentRendererProps) {
  const [sanitizedContent, setSanitizedContent] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [securityIssues, setSecurityIssues] = useState<string[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<any>(null);

  useEffect(() => {
    const validateAndSanitize = async () => {
      setIsValidating(true);
      
      try {
        // Monitor performance
        const endTiming = PerformanceMonitor.startTiming('content_validation');
        
        // Validate and sanitize content
        const securityResult = SecurityUtils.sanitizeHtml(content);
        setSanitizedContent(securityResult.sanitized);
        setSecurityIssues(securityResult.issues);
        
        if (securityResult.issues.length > 0) {
          console.warn('Content security issues found:', securityResult.issues);
        }

        // Quality validation
        if (moduleId && courseId) {
          const qualityResult = await ContentQualityValidator.validateContent(
            content, 
            title || '', 
            quiz, 
            moduleId, 
            courseId
          );
          setQualityMetrics(qualityResult.metrics);
        }
        
        endTiming();
      } catch (error) {
        console.error('Content validation failed:', error);
        setSanitizedContent(content); // Fallback to original content
      } finally {
        setIsValidating(false);
      }
    };

    if (content) {
      validateAndSanitize();
    }
  }, [content, title, quiz, moduleId, courseId]);

  const parsedContent = parseHTMLContent(sanitizedContent || content, title);

  const renderSection = (section: ContentSection, index: number) => {
    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${Math.min(section.level || 2, 6)}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag 
            key={index}
            className={cn(
              "font-bold text-gray-900 mt-8 mb-4 first:mt-0",
              section.level === 1 && "text-3xl",
              section.level === 2 && "text-2xl", 
              section.level === 3 && "text-xl",
              section.level === 4 && "text-lg",
              (section.level || 0) >= 5 && "text-base"
            )}
          >
            {section.content}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <p key={index} className="text-gray-700 leading-relaxed mb-4 xs:mb-6 text-sm xs:text-base lg:text-lg">
            {section.content}
          </p>
        );

      case 'list':
        return (
          <div key={index} className="mb-4 xs:mb-6">
            {section.content && section.content !== 'Key Points:' && (
              <h4 className="font-semibold text-gray-900 mb-2 xs:mb-3 flex items-center gap-2 text-sm xs:text-base">
                <List className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600" />
                {section.content}
              </h4>
            )}
            <ul className="space-y-2 xs:space-y-3 ml-4 xs:ml-6">
              {section.items?.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-700 leading-relaxed relative text-sm xs:text-base">
                  <span className="absolute -left-4 xs:-left-6 top-0 w-1.5 h-1.5 xs:w-2 xs:h-2 bg-blue-500 rounded-full mt-2 xs:mt-2.5"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'highlight':
        return (
          <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-3 xs:p-4 mb-4 xs:mb-6 rounded-r-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 xs:h-5 xs:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800 font-medium leading-relaxed text-sm xs:text-base">{section.content}</p>
            </div>
          </div>
        );

      case 'code':
        return (
          <div key={index} className="bg-gray-900 rounded-lg p-3 xs:p-4 mb-4 xs:mb-6 overflow-x-auto">
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-3 w-3 xs:h-4 xs:w-4 text-gray-400" />
              <span className="text-gray-400 text-xs xs:text-sm">Code Example</span>
            </div>
            <pre className="text-green-400 text-xs xs:text-sm font-mono">
              <code>{section.content}</code>
            </pre>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4 xs:space-y-6 lg:space-y-8", className)}>
      {/* Security Issues Warning */}
      {securityIssues.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2 xs:pb-3 p-3 xs:p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-orange-800 text-sm xs:text-base lg:text-lg">
              <Shield className="h-4 w-4 xs:h-5 xs:w-5" />
              <span>Content Security Notice</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
            <p className="text-orange-700 text-sm mb-2">
              {securityIssues.length} security issue(s) detected and automatically resolved:
            </p>
            <ul className="text-orange-600 text-xs space-y-1">
              {securityIssues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Validation Loading State */}
      {isValidating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-blue-700 text-sm">🔍 Validating content security and quality...</p>
          </CardContent>
        </Card>
      )}
      {/* Learning Objective Card - Mobile Responsive */}
      {(learningObjective || parsedContent.learningObjective) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2 xs:pb-3 p-3 xs:p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-blue-800 text-sm xs:text-base lg:text-lg">
              <Target className="h-4 w-4 xs:h-5 xs:w-5" />
              <span>Learning Objective</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
            <p className="text-blue-700 font-medium text-sm xs:text-base lg:text-lg leading-relaxed">
              {learningObjective || parsedContent.learningObjective}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Mobile Responsive */}
      <Card>
        <CardContent className="pt-4 xs:pt-6 lg:pt-8 p-3 xs:p-4 sm:p-6">
          <div className="prose prose-sm xs:prose-base lg:prose-lg prose-gray max-w-none">
            {parsedContent.sections.map(renderSection)}
          </div>
        </CardContent>
      </Card>

      {/* Key Points Summary - Mobile Responsive */}
      {parsedContent.keyPoints.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2 xs:pb-3 p-3 xs:p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-green-800 text-sm xs:text-base lg:text-lg">
              <Quote className="h-4 w-4 xs:h-5 xs:w-5" />
              <span>Key Takeaways</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 xs:p-4 sm:p-6 pt-0">
            <div className="grid gap-2 xs:gap-3">
              {parsedContent.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2 xs:gap-3">
                  <Badge className="bg-green-600 text-white min-w-[20px] h-5 xs:min-w-[24px] xs:h-6 rounded-full flex items-center justify-center text-xs xs:text-sm">
                    {index + 1}
                  </Badge>
                  <p className="text-green-700 leading-relaxed text-sm xs:text-base">{point}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
