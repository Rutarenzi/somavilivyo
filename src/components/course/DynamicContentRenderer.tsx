import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle, RefreshCw } from "lucide-react";
import { EnhancedContentRenderer } from "./EnhancedContentRenderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DynamicContentRendererProps {
  content: string;
  title?: string;
  learningObjective?: string;
  className?: string;
  stylePreferences?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
    animationStyle?: string;
    layoutStyle?: string;
  };
  generatedCode?: string;
  onRegenerateCode?: () => void;
}

// Simple sandbox component for rendering dynamic code
const DynamicCodeRenderer: React.FC<{
  code: string;
  stylePreferences: any;
  content: string;
  title?: string;
  learningObjective?: string;
}> = ({ code, stylePreferences, content, title, learningObjective }) => {
  const [isValid, setIsValid] = useState(false);
  const [parsedComponent, setParsedComponent] = useState<any>(null);

  useEffect(() => {
    try {
      // Parse the JSON response from Gemini
      const parsed = JSON.parse(code);
      if (parsed && parsed.component) {
        setIsValid(true);
        setParsedComponent(parsed);
      }
    } catch (error) {
      console.error('Failed to parse dynamic component:', error);
      setIsValid(false);
    }
  }, [code]);

  if (!isValid || !parsedComponent) {
    return null;
  }

  // Apply style preferences as CSS custom properties
  const styleVars = {
    '--primary-color': stylePreferences?.primaryColor || '#3b82f6',
    '--secondary-color': stylePreferences?.secondaryColor || '#10b981',
    '--font-family': stylePreferences?.fontFamily || 'Inter',
    '--font-size-base': stylePreferences?.fontSize === 'sm' ? '14px' : 
                        stylePreferences?.fontSize === 'lg' ? '18px' :
                        stylePreferences?.fontSize === 'xl' ? '20px' : '16px',
  } as React.CSSProperties;

  const animationClass = stylePreferences?.animationStyle === 'fade' ? 'animate-fade-in' :
                        stylePreferences?.animationStyle === 'slide' ? 'animate-slide-in-right' :
                        stylePreferences?.animationStyle === 'scale' ? 'animate-scale-in' :
                        stylePreferences?.animationStyle === 'bounce' ? 'animate-bounce' : '';

  return (
    <div 
      className={cn("space-y-6", animationClass)}
      style={styleVars}
    >
      {/* Learning Objective with custom styling */}
      {learningObjective && (
        <Card 
          className="border-2 shadow-lg"
          style={{ 
            borderColor: stylePreferences?.primaryColor || '#3b82f6',
            backgroundColor: `${stylePreferences?.primaryColor || '#3b82f6'}10`
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target 
                className="h-5 w-5" 
                style={{ color: stylePreferences?.primaryColor || '#3b82f6' }}
              />
              <h3 
                className="font-semibold text-lg"
                style={{ 
                  color: stylePreferences?.primaryColor || '#3b82f6',
                  fontFamily: stylePreferences?.fontFamily || 'Inter'
                }}
              >
                Learning Objective
              </h3>
            </div>
            <p 
              className="leading-relaxed"
              style={{ 
                fontSize: styleVars['--font-size-base'],
                fontFamily: stylePreferences?.fontFamily || 'Inter'
              }}
            >
              {learningObjective}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dynamic content with style-aware rendering */}
      <div
        className={cn(
          "prose max-w-none",
          stylePreferences?.layoutStyle === 'two-column' && 'columns-2 gap-8',
          stylePreferences?.layoutStyle === 'card-layout' && 'space-y-4'
        )}
        style={{
          fontFamily: stylePreferences?.fontFamily || 'Inter',
          fontSize: styleVars['--font-size-base']
        }}
      >
        {/* Render the dynamic component structure */}
        {parsedComponent.sections?.map((section: any, index: number) => (
          <div key={index} className={cn(
            "mb-6",
            stylePreferences?.layoutStyle === 'card-layout' && "bg-white rounded-lg shadow-md p-6 border-l-4",
            animationClass
          )}
          style={{
            borderLeftColor: index % 2 === 0 ? 
              stylePreferences?.primaryColor || '#3b82f6' : 
              stylePreferences?.secondaryColor || '#10b981'
          }}>
            {section.title && (
              <h3 
                className="font-bold mb-3"
                style={{ 
                  color: stylePreferences?.primaryColor || '#3b82f6',
                  fontFamily: stylePreferences?.fontFamily || 'Inter'
                }}
              >
                {section.title}
              </h3>
            )}
            <div 
              className="prose prose-gray max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
            {section.highlight && (
              <div 
                className="mt-4 p-3 rounded-lg border-l-4"
                style={{
                  backgroundColor: `${stylePreferences?.secondaryColor || '#10b981'}15`,
                  borderLeftColor: stylePreferences?.secondaryColor || '#10b981'
                }}
              >
                <p 
                  className="font-medium"
                  style={{ color: stylePreferences?.secondaryColor || '#10b981' }}
                >
                  {section.highlight}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key takeaways with custom styling */}
      {parsedComponent.keyTakeaways && (
        <Card 
          className="border-2 shadow-lg"
          style={{ 
            borderColor: stylePreferences?.secondaryColor || '#10b981',
            backgroundColor: `${stylePreferences?.secondaryColor || '#10b981'}10`
          }}
        >
          <CardContent className="p-4">
            <h3 
              className="font-bold text-lg mb-4 flex items-center space-x-2"
              style={{ 
                color: stylePreferences?.secondaryColor || '#10b981',
                fontFamily: stylePreferences?.fontFamily || 'Inter'
              }}
            >
              <span>💡 Key Takeaways</span>
            </h3>
            <div className="space-y-3">
              {parsedComponent.keyTakeaways.map((takeaway: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: stylePreferences?.secondaryColor || '#10b981' }}
                  >
                    {index + 1}
                  </Badge>
                  <p 
                    className="leading-relaxed"
                    style={{ 
                      fontSize: styleVars['--font-size-base'],
                      fontFamily: stylePreferences?.fontFamily || 'Inter'
                    }}
                  >
                    {takeaway}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export function DynamicContentRenderer({ 
  content, 
  title, 
  learningObjective, 
  className,
  stylePreferences = {},
  generatedCode,
  onRegenerateCode
}: DynamicContentRendererProps) {
  const [useDynamicRender, setUseDynamicRender] = useState(!!generatedCode);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Validate and attempt dynamic rendering
  useEffect(() => {
    if (generatedCode) {
      try {
        JSON.parse(generatedCode);
        setUseDynamicRender(true);
        setRenderError(null);
      } catch (error) {
        console.error('Dynamic content validation failed:', error);
        setRenderError('Invalid dynamic content format');
        setUseDynamicRender(false);
      }
    }
  }, [generatedCode]);

  // Fallback to enhanced renderer if dynamic rendering fails
  if (!useDynamicRender || renderError || !generatedCode) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Error indicator with retry option */}
        {renderError && generatedCode && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-orange-800 font-medium">Dynamic Rendering Failed</p>
                    <p className="text-orange-700 text-sm mt-1">
                      Falling back to standard content rendering. The lesson content is still fully accessible.
                    </p>
                  </div>
                </div>
                {onRegenerateCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerateCode}
                    className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Enhanced content renderer as fallback */}
        <EnhancedContentRenderer
          content={content}
          title={title}
          learningObjective={learningObjective}
          className={className}
        />
      </div>
    );
  }

  // Render dynamic content
  return (
    <div className={cn("space-y-6", className)}>
      <DynamicCodeRenderer
        code={generatedCode}
        stylePreferences={stylePreferences}
        content={content}
        title={title}
        learningObjective={learningObjective}
      />
    </div>
  );
}