import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Lightbulb, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";
import { EnhancedContentRenderer } from "./EnhancedContentRenderer";
import { cn } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { SandboxErrorBoundary } from "@/components/ui/SandboxErrorBoundary";
import { CodeSandboxRenderer } from "./CodeSandboxRenderer";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface StylePreferences {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: string;
  animationStyle?: string;
  layoutStyle?: string;
}

interface DynamicComponent {
  type: 'lesson';
  title: string;
  learningObjective?: string;
  sections: Array<{
    type: 'introduction' | 'main_content' | 'example' | 'summary' | 'activity';
    title?: string;
    content: string;
    highlight?: string;
    interactive?: boolean;
    code?: string;
  }>;
  keyTakeaways?: string[];
  callToAction?: {
    title: string;
    description: string;
    action: string;
  };
}

interface EnhancedDynamicContentRendererProps {
  content: string;
  title?: string;
  learningObjective?: string;
  className?: string;
  stylePreferences?: StylePreferences;
  generatedCode?: string;
  moduleId?: string;
  onRegenerateCode?: () => void;
  onCodeSaved?: (code: string) => void;
}

// Sanitize Gemini component code into executable React
// CRITICAL: Ensures sandbox handshake by injecting useEffect for 'sandbox-ready' message
function sanitizeComponentCode(code: string): string {
  if (!code) {
    console.error('🚫 sanitizeComponentCode: empty input');
    return '';
  }
  let out = code;
  try {
    console.log('🧹 sanitizeComponentCode: start', { length: out.length, preview: String(out).substring(0, 120) + '...' });
    // Strip markdown code fences
    out = out.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();

    // Unwrap JSON { component: "..." }
    try {
      const j = JSON.parse(out);
      if (j && typeof j.component === 'string') {
        console.log('🧩 sanitizeComponentCode: unwrapped JSON component');
        out = j.component;
      }
    } catch {}

    // Ensure default export if LessonContent function exists
    if (!/export\s+default/.test(out) && /function\s+LessonContent\s*\(/.test(out)) {
      console.error('⚠️ sanitizeComponentCode: missing default export, adding it automatically');
      out = out.replace(/^\s*function\s+LessonContent/, 'export default function LessonContent');
    }

    // Basic checks and hints
    if (!/export\s+default/.test(out) && !/function\s+LessonContent\s*\(/.test(out)) {
      console.error('🚫 sanitizeComponentCode: no export default or LessonContent() found');
    }
    if (/style\s*=\s*\{?\{/.test(out)) {
      console.error('🚫 sanitizeComponentCode: inline styles detected; Tailwind classes are required');
    }

    // CRITICAL: Inject sandbox-ready handshake if missing
    // This prevents timeout errors by ensuring the component signals readiness
    if (!/window\.parent\.postMessage.*sandbox-ready/.test(out) && !/React\.useEffect/.test(out)) {
      console.log('🔧 Injecting sandbox-ready handshake useEffect');
      
      // Find the component function body
      const functionMatch = out.match(/(export\s+default\s+)?function\s+\w+\s*\([^)]*\)\s*\{/);
      if (functionMatch) {
        const insertPos = functionMatch.index! + functionMatch[0].length;
        const handshakeCode = `
  // Handshake with parent to signal successful render
  React.useEffect(() => {
    try {
      window.parent && window.parent.postMessage({ 
        source: 'codesandbox', 
        type: 'sandbox-ready' 
      }, '*');
    } catch(e) {
      console.warn('Failed to send sandbox-ready message:', e);
    }
  }, []);
`;
        out = out.slice(0, insertPos) + handshakeCode + out.slice(insertPos);
        console.log('✅ Sandbox-ready handshake injected');
      }
    }

    console.log('🧹 sanitizeComponentCode: done', { length: out.length });
    return out;
  } catch (e) {
    console.error('❌ sanitizeComponentCode failed:', e);
    return String(code || '');
  }
}

// Secure dynamic component renderer
const SecureDynamicRenderer: React.FC<{
  component: DynamicComponent;
  stylePreferences: StylePreferences;
}> = ({ component, stylePreferences }) => {
  // CSS custom properties for theming
  const themeVars = {
    '--theme-primary': stylePreferences.primaryColor || '#3b82f6',
    '--theme-secondary': stylePreferences.secondaryColor || '#10b981',
    '--theme-font': stylePreferences.fontFamily || 'Inter',
  } as React.CSSProperties;

  // Animation classes based on preferences
  const getAnimationClass = (delay = 0) => {
    const baseClass = stylePreferences.animationStyle === 'fade' ? 'animate-fade-in' :
                     stylePreferences.animationStyle === 'slide' ? 'animate-slide-in-right' :
                     stylePreferences.animationStyle === 'scale' ? 'animate-scale-in' :
                     stylePreferences.animationStyle === 'bounce' ? 'animate-bounce' : '';
    
    return cn(baseClass, delay > 0 && `animation-delay-${delay}`);
  };

  // Layout wrapper based on style preference
  const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (stylePreferences.layoutStyle === 'two-column') {
      return <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">{children}</div>;
    }
    if (stylePreferences.layoutStyle === 'magazine') {
      return <div className="space-y-8 max-w-4xl mx-auto">{children}</div>;
    }
    return <div className="space-y-6">{children}</div>;
  };

  const renderSection = (section: any, index: number) => {
    const sectionStyle = {
      fontFamily: themeVars['--theme-font'],
      fontSize: stylePreferences.fontSize === 'sm' ? '14px' :
                stylePreferences.fontSize === 'lg' ? '18px' :
                stylePreferences.fontSize === 'xl' ? '20px' : '16px'
    };

    switch (section.type) {
      case 'introduction':
        return (
          <Card 
            key={index} 
            className={cn("border-l-4 shadow-lg", getAnimationClass(index * 100))}
            style={{ 
              borderLeftColor: themeVars['--theme-primary'],
              backgroundColor: `${themeVars['--theme-primary']}08`
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: themeVars['--theme-primary'] }}
              >
                <Sparkles className="h-5 w-5" />
                <span style={sectionStyle}>{section.title || 'Introduction'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-lg max-w-none"
                style={sectionStyle}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
              {section.highlight && (
                <div 
                  className="mt-4 p-3 rounded-lg border-l-4"
                  style={{
                    backgroundColor: `${themeVars['--theme-secondary']}15`,
                    borderLeftColor: themeVars['--theme-secondary']
                  }}
                >
                  <div className="flex items-start space-x-2">
                    <Lightbulb 
                      className="h-4 w-4 mt-1 flex-shrink-0"
                      style={{ color: themeVars['--theme-secondary'] }}
                    />
                    <p 
                      className="font-medium"
                      style={{ 
                        color: themeVars['--theme-secondary'],
                        ...sectionStyle
                      }}
                    >
                      {section.highlight}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'main_content':
        return (
          <Card 
            key={index}
            className={cn(
              "shadow-md",
              getAnimationClass(index * 100),
              stylePreferences.layoutStyle === 'card-layout' && "border-2"
            )}
            style={stylePreferences.layoutStyle === 'card-layout' ? {
              borderColor: themeVars['--theme-primary']
            } : {}}
          >
            <CardContent className="pt-6">
              {section.title && (
                <h3 
                  className="text-xl font-bold mb-4"
                  style={{ 
                    color: themeVars['--theme-primary'],
                    ...sectionStyle
                  }}
                >
                  {section.title}
                </h3>
              )}
              <div 
                className="prose prose-gray max-w-none"
                style={sectionStyle}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </CardContent>
          </Card>
        );

      case 'example':
        return (
          <Card 
            key={index}
            className={cn("border-2 shadow-lg", getAnimationClass(index * 100))}
            style={{ 
              borderColor: themeVars['--theme-secondary'],
              backgroundColor: `${themeVars['--theme-secondary']}08`
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle 
                className="text-lg"
                style={{ color: themeVars['--theme-secondary'] }}
              >
                💡 {section.title || 'Example'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                style={sectionStyle}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
              {section.code && (
                <div className="mt-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
                    <code>{section.code}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'activity':
        return (
          <Card 
            key={index}
            className={cn("border-2 shadow-lg", getAnimationClass(index * 100))}
            style={{ 
              borderColor: themeVars['--theme-primary'],
              background: `linear-gradient(135deg, ${themeVars['--theme-primary']}10, ${themeVars['--theme-secondary']}10)`
            }}
          >
            <CardHeader>
              <CardTitle 
                className="flex items-center space-x-2"
                style={{ color: themeVars['--theme-primary'] }}
              >
                <span>🎯 {section.title || 'Practice Activity'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                style={sectionStyle}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
              {section.interactive && (
                <Button 
                  className="mt-4"
                  style={{ 
                    backgroundColor: themeVars['--theme-primary'],
                    borderColor: themeVars['--theme-primary']
                  }}
                >
                  Start Activity
                </Button>
              )}
            </CardContent>
          </Card>
        );

      default:
        return (
          <div 
            key={index}
            className={cn("p-4 rounded-lg", getAnimationClass(index * 100))}
            style={sectionStyle}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        );
    }
  };

  return (
    <div style={themeVars} className="space-y-6">
      {/* Learning Objective */}
      {component.learningObjective && (
        <Card 
          className={cn("border-2 shadow-lg", getAnimationClass())}
          style={{ 
            borderColor: themeVars['--theme-primary'],
            backgroundColor: `${themeVars['--theme-primary']}08`
          }}
        >
          <CardHeader className="pb-3">
            <CardTitle 
              className="flex items-center space-x-2"
              style={{ 
                color: themeVars['--theme-primary'],
                fontFamily: themeVars['--theme-font']
              }}
            >
              <Target className="h-5 w-5" />
              <span>Learning Objective</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p 
              className="font-medium leading-relaxed"
              style={{ 
                fontFamily: themeVars['--theme-font'],
                fontSize: stylePreferences.fontSize === 'sm' ? '14px' :
                          stylePreferences.fontSize === 'lg' ? '18px' :
                          stylePreferences.fontSize === 'xl' ? '20px' : '16px'
              }}
            >
              {component.learningObjective}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dynamic sections */}
      <LayoutWrapper>
        {component.sections.map(renderSection)}
      </LayoutWrapper>

      {/* Key Takeaways */}
      {component.keyTakeaways && component.keyTakeaways.length > 0 && (
        <Card 
          className={cn("border-2 shadow-lg", getAnimationClass(component.sections.length * 100))}
          style={{ 
            borderColor: themeVars['--theme-secondary'],
            backgroundColor: `${themeVars['--theme-secondary']}08`
          }}
        >
          <CardHeader>
            <CardTitle 
              className="flex items-center space-x-2"
              style={{ 
                color: themeVars['--theme-secondary'],
                fontFamily: themeVars['--theme-font']
              }}
            >
              <span>✨ Key Takeaways</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {component.keyTakeaways.map((takeaway, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Badge 
                    className="text-white text-xs"
                    style={{ backgroundColor: themeVars['--theme-secondary'] }}
                  >
                    {index + 1}
                  </Badge>
                  <p 
                    className="leading-relaxed"
                    style={{ 
                      fontFamily: themeVars['--theme-font'],
                      fontSize: stylePreferences.fontSize === 'sm' ? '14px' :
                                stylePreferences.fontSize === 'lg' ? '18px' :
                                stylePreferences.fontSize === 'xl' ? '20px' : '16px'
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

      {/* Call to Action */}
      {component.callToAction && (
        <Card 
          className={cn("border-2 shadow-lg text-center", getAnimationClass((component.sections.length + 1) * 100))}
          style={{ 
            borderColor: themeVars['--theme-primary'],
            background: `linear-gradient(135deg, ${themeVars['--theme-primary']}15, ${themeVars['--theme-secondary']}15)`
          }}
        >
          <CardContent className="pt-6">
            <h3 
              className="text-xl font-bold mb-2"
              style={{ 
                color: themeVars['--theme-primary'],
                fontFamily: themeVars['--theme-font']
              }}
            >
              {component.callToAction.title}
            </h3>
            <p 
              className="mb-4"
              style={{ 
                fontFamily: themeVars['--theme-font'],
                fontSize: stylePreferences.fontSize === 'sm' ? '14px' :
                          stylePreferences.fontSize === 'lg' ? '18px' :
                          stylePreferences.fontSize === 'xl' ? '20px' : '16px'
              }}
            >
              {component.callToAction.description}
            </p>
            <Button 
              style={{ 
                backgroundColor: themeVars['--theme-primary'],
                borderColor: themeVars['--theme-primary']
              }}
            >
              {component.callToAction.action}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export function EnhancedDynamicContentRenderer({ 
  content, 
  title, 
  learningObjective, 
  className,
  stylePreferences = {},
  generatedCode,
  moduleId,
  onRegenerateCode,
  onCodeSaved
}: EnhancedDynamicContentRendererProps) {
  const { user } = useAuth();
  const [dynamicComponent, setDynamicComponent] = useState<DynamicComponent | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);
  const [fallbackContent, setFallbackContent] = useState<string | null>(null);
  const [isGeneratingFallback, setIsGeneratingFallback] = useState(false);
  const [awaitingSandboxReady, setAwaitingSandboxReady] = useState(false);
  const [generationRetryCount, setGenerationRetryCount] = useState(0);
  const [pendingCodeToSave, setPendingCodeToSave] = useState<string | null>(null);
  const [lastRenderError, setLastRenderError] = useState<string | null>(null);
  const MAX_RETRIES = 5;
  
  // Prevent multiple simultaneous generation calls
  const isGeneratingRef = useRef(false);
  const contentHashRef = useRef<string>('');
  const retryCountRef = useRef(0);

  // Debug: log render errors and state
  useEffect(() => {
    if (renderError) {
      console.warn('🧱 EnhancedDynamicContentRenderer using fallback:', renderError, {
        hasSandboxCode: !!sandboxCode,
        hasDynamicComponent: !!dynamicComponent,
        fallbackLength: fallbackContent?.length || 0
      });
    }
  }, [renderError]);

  useEffect(() => {
    if (sandboxCode) {
      console.log('🧪 sandboxCode set', { length: sandboxCode.length });
    } else {
      console.log('🧪 sandboxCode cleared');
    }
  }, [sandboxCode]);

  // Simplified function to detect plain text vs React content
  const isPlainTextContent = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    
    const trimmed = text.trim();
    
    // Strong React indicators
    const hasExportDefault = trimmed.includes('export default');
    const hasFunction = /function\s+\w+\s*\(/.test(trimmed);
    const hasJSXReturn = /return\s*\(?\s*</.test(trimmed);
    
    // If it has React patterns, it's not plain text
    if (hasExportDefault && hasFunction && hasJSXReturn) {
      console.log('🎯 Detected React component code');
      return false;
    }
    
    // Check for JSON structure (our legacy format)
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.component || parsed.type === 'lesson' || parsed.sections) {
          console.log('🎯 Detected structured JSON content');
          return false;
        }
      } catch {}
    }
    
    // Everything else is plain text that needs UI Shell Generator
    console.log('🎯 Detected plain text content - will trigger UI Shell Generator');
    return true;
  };

  // Save code to database only after successful render
  const saveCodeToDatabase = async (code: string) => {
    if (!moduleId) {
      console.warn('⚠️ No moduleId provided, skipping database save');
      return;
    }

    try {
      console.log('💾 Saving successfully rendered code to database...');
      const { error: updateError } = await supabase
        .from('micro_modules')
        .update({ generated_code: code })
        .eq('id', moduleId);
      
      if (updateError) {
        console.error('❌ Failed to save generated code to database:', updateError);
      } else {
        console.log('✅ Generated code saved to database successfully');
        onCodeSaved?.(code);
        setPendingCodeToSave(null);
      }
    } catch (saveError) {
      console.error('❌ Error saving generated code:', saveError);
    }
  };

  // UI Shell Generator with intelligent retry on render failure - NON-RECURSIVE version
  const triggerUIShellGenerator = async (
    rawContent: string, 
    errorContext: string | null = null,
    retryAttempt: number = 0
  ): Promise<string | null> => {
    if (!user) {
      console.log('❌ No user, cannot generate UI');
      return null;
    }
    
    // Prevent simultaneous generation calls
    if (isGeneratingRef.current) {
      console.log('⚠️ Generation already in progress, skipping duplicate call');
      return null;
    }
    
    if (retryAttempt >= MAX_RETRIES) {
      console.error(`❌ Max retries (${MAX_RETRIES}) reached for UI Shell Generator`);
      isGeneratingRef.current = false;
      return null;
    }
    
    isGeneratingRef.current = true;
    setIsGeneratingFallback(true);
    
    try {
      // Build context message with error details for retries
      let contextMessage = '';
      if (errorContext && retryAttempt > 0) {
        contextMessage = `\n\n⚠️ CRITICAL - PREVIOUS ATTEMPT FAILED (Retry ${retryAttempt}/${MAX_RETRIES}):\n`;
        contextMessage += `Error: ${errorContext}\n`;
        contextMessage += `Please analyze the error and generate corrected, error-free React code that will render successfully.\n`;
        contextMessage += `Common issues to check:\n`;
        contextMessage += `- Ensure all JSX elements are properly closed\n`;
        contextMessage += `- Use only Tailwind classes (no inline styles)\n`;
        contextMessage += `- Export default function component\n`;
        contextMessage += `- No syntax errors in JSX or JavaScript\n`;
        contextMessage += `- Component must signal ready when mounted (useEffect with postMessage)\n`;
      }
      
      console.log('🚀 Calling UI Shell Generator:', {
        contentLength: rawContent.length,
        retry: retryAttempt,
        maxRetries: MAX_RETRIES,
        hasErrorContext: !!errorContext
      });
      
      const { data, error } = await supabase.functions.invoke('ui-shell-generator', {
        body: {
          rawContent: rawContent + contextMessage,
          moduleTitle: title || 'Lesson Content',
          learningObjective,
          userId: user.id
        }
      });

      if (error) {
        console.error('❌ UI Shell Generator API error:', error);
        throw error;
      }
      
      if (data?.success && data?.component) {
        console.log('✅ UI Shell Generator returned component:', data.component.length, 'characters');
        
        // Sanitize and validate the component structure
        const cleanedComponent = sanitizeComponentCode(data.component);
        if (cleanedComponent && (/export\s+default/.test(cleanedComponent) || /function\s+LessonContent/.test(cleanedComponent))) {
          console.log('✅ Component validation passed - will save to database ONLY after successful render');
          
          // Mark this code as pending save (will be saved only after successful render)
          setPendingCodeToSave(cleanedComponent);
          retryCountRef.current = retryAttempt;
          setGenerationRetryCount(retryAttempt);
          
          return cleanedComponent;
        } else {
          throw new Error('Generated component failed validation - missing export default or function');
        }
      } else {
        throw new Error('No component returned from UI Shell Generator');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ UI Shell Generator failed:', errorMsg);
      setLastRenderError(errorMsg);
      
      // DO NOT retry recursively - let the sandbox error handler retry
      return null;
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingFallback(false);
    }
  };

  // Validate and parse generated code - triggers ONCE per content change
  useEffect(() => {
    // Create a hash of the content to detect actual changes
    const currentHash = `${generatedCode || ''}_${content || ''}`;
    if (currentHash === contentHashRef.current) {
      console.log('📌 Content unchanged, skipping processing');
      return;
    }
    
    console.log('🆕 Content changed, processing...');
    contentHashRef.current = currentHash;
    isGeneratingRef.current = false;
    retryCountRef.current = 0;
    setGenerationRetryCount(0);
    setFallbackContent(null);
    setRenderError(null);
    setPendingCodeToSave(null);
    
    console.log('🔄 Processing content:', {
      hasGeneratedCode: !!generatedCode,
      hasContent: !!content,
      contentLength: (generatedCode || content)?.length || 0,
      preview: (generatedCode || content)?.substring(0, 100) + '...'
    });
    
    // Priority 1: Use saved generated_code if available
    if (generatedCode && typeof generatedCode === 'string') {
      console.log('🎯 Found saved generated_code, using it directly (token savings!)');
      const cleaned = sanitizeComponentCode(generatedCode);
      if (/export\s+default/.test(cleaned) || /function\s+\w+\s*\(/.test(cleaned)) {
        const ensured = /export\s+default/.test(cleaned)
          ? cleaned
          : cleaned.replace(/^\s*function\s+(\w+)/, 'export default function $1');
        console.log('✅ Using saved component code (no API call needed)');
        setSandboxCode(ensured);
        setDynamicComponent(null);
        setIsValidating(false);
        return;
      }
    }
    
    // Priority 2: Process content
    const primaryContent = content;
    
    if (primaryContent && typeof primaryContent === 'string') {
      // Check if it's React code
      if (!isPlainTextContent(primaryContent)) {
        console.log('🎯 Processing as React component code');
        const cleaned = sanitizeComponentCode(primaryContent);
        if (/export\s+default/.test(cleaned) || /function\s+\w+\s*\(/.test(cleaned)) {
          const ensured = /export\s+default/.test(cleaned)
            ? cleaned
            : cleaned.replace(/^\s*function\s+(\w+)/, 'export default function $1');
          console.log('✅ Setting sandbox code for rendering');
          setSandboxCode(ensured);
          setDynamicComponent(null);
          setIsValidating(false);
          return;
        }
      }
      
      // If it's plain text, trigger UI Shell Generator automatically ONCE
      if (isPlainTextContent(primaryContent)) {
        console.log('🔄 Plain text detected, automatically triggering UI Shell Generator (ONCE)');
        
        triggerUIShellGenerator(primaryContent, null, 0).then((generatedComponent) => {
          if (generatedComponent) {
            const cleaned = sanitizeComponentCode(generatedComponent);
            if (/export\s+default/.test(cleaned) || /function\s+\w+\s*\(/.test(cleaned)) {
              const ensured = /export\s+default/.test(cleaned)
                ? cleaned
                : cleaned.replace(/^\s*function\s+(\w+)/, 'export default function $1');
              console.log('✅ Setting generated component code for sandbox rendering');
              setSandboxCode(ensured);
              setDynamicComponent(null);
              setRenderError(null);
              return;
            }
          }
          
          // Fall back if generation failed
          console.log('⚠️ Falling back to manual content rendering');
          setFallbackContent(primaryContent);
          setRenderError(null);
        }).catch((error) => {
          console.error('❌ UI Shell Generator failed:', error);
          setFallbackContent(primaryContent);
          setRenderError(`Failed to generate styled component: ${error.message}`);
        });
        
        setIsValidating(false);
        return;
      }
      
      // Try JSON parsing for legacy structured content
      try {
        const parsedContent = JSON.parse(primaryContent);
        if (parsedContent.component) {
          console.log('🎯 Found component in JSON, setting as sandbox code');
          setSandboxCode(sanitizeComponentCode(parsedContent.component));
          setDynamicComponent(null);
          setIsValidating(false);
          return;
        } else if (parsedContent.type === 'lesson' || parsedContent.sections) {
          console.log('🎯 Found structured lesson content');
          setDynamicComponent(parsedContent);
          setSandboxCode(null);
          setIsValidating(false);
          return;
        }
      } catch (parseError) {
        console.log('📄 Content is not JSON, using as fallback');
      }
      
      // Final fallback for any other content
      console.log('⚠️ Using content as fallback');
      setFallbackContent(primaryContent);
    }
    
    setIsValidating(false);
  }, [generatedCode, content, title, learningObjective]);

  // Handshake with sandboxed iframe to ensure mount success and fallback on timeout
  useEffect(() => {
    if (!sandboxCode) return;
    setAwaitingSandboxReady(true);

    const timer = window.setTimeout(() => {
      const timeoutError = 'Sandbox handshake timeout - component did not signal readiness within 15 seconds';
      console.error('⏳', timeoutError, {
        codeLength: sandboxCode?.length || 0,
        title,
        learningObjective,
        retryCount: generationRetryCount
      });
      
      // Store timeout error for retry context
      setLastRenderError(timeoutError);
      setRenderError(timeoutError);
      setAwaitingSandboxReady(false);
      
      // Retry generation with timeout error context
      if (retryCountRef.current < MAX_RETRIES && content) {
        const nextRetry = retryCountRef.current + 1;
        console.log(`🔄 Retrying UI Shell Generator due to sandbox timeout (${nextRetry}/${MAX_RETRIES})...`);
        
        triggerUIShellGenerator(content, timeoutError, nextRetry).then((generatedComponent) => {
          if (generatedComponent) {
            const cleaned = sanitizeComponentCode(generatedComponent);
            if (/export\s+default/.test(cleaned) || /function\s+\w+\s*\(/.test(cleaned)) {
              const ensured = /export\s+default/.test(cleaned)
                ? cleaned
                : cleaned.replace(/^\s*function\s+(\w+)/, 'export default function $1');
              console.log('✅ Setting retry-generated component after timeout');
              setSandboxCode(ensured);
              setRenderError(null);
              return;
            }
          }
          // Fall back if retry fails
          console.log(`⚠️ Falling back after timeout retry ${nextRetry} failed`);
          setSandboxCode(null);
          setDynamicComponent(null);
          setFallbackContent(fallbackContent || content);
        });
      } else {
        // Max retries reached, use fallback
        console.log(`⚠️ Max retries (${MAX_RETRIES}) reached after timeout, using fallback`);
        setSandboxCode(null);
        setDynamicComponent(null);
        setFallbackContent(fallbackContent || content);
      }
    }, 15000); // Increased timeout from 5s to 15s to give more time for complex components

    const handler = (event: MessageEvent) => {
      const data = (event && (event as any).data) || null;
      if (!data || data.source !== 'codesandbox') return;
      
      if (data.type === 'sandbox-ready') {
        window.clearTimeout(timer);
        setAwaitingSandboxReady(false);
        console.log('✅ Sandbox ready - interactive content loaded');
        
        // Save code to database on successful render
        if (pendingCodeToSave) {
          console.log('💾 Sandbox ready confirmed, saving code to database');
          saveCodeToDatabase(pendingCodeToSave);
        }
      } else if (data.type === 'sandbox-error') {
        window.clearTimeout(timer);
        const sandboxError = data.error || 'Unknown sandbox error';
        console.error('🛑 Sandbox reported error:', sandboxError);
        
        // Store error for retry context
        setLastRenderError(sandboxError);
        setRenderError(sandboxError);
        setAwaitingSandboxReady(false);
        
        // Clear pending code since it failed
        setPendingCodeToSave(null);
        
        // Retry generation with error context instead of falling back immediately
        if (retryCountRef.current < MAX_RETRIES && content) {
          const nextRetry = retryCountRef.current + 1;
          console.log(`🔄 Retrying UI Shell Generator due to sandbox error (${nextRetry}/${MAX_RETRIES})...`);
          
          triggerUIShellGenerator(content, sandboxError, nextRetry).then((generatedComponent) => {
            if (generatedComponent) {
              const cleaned = sanitizeComponentCode(generatedComponent);
              if (/export\s+default/.test(cleaned) || /function\s+\w+\s*\(/.test(cleaned)) {
                const ensured = /export\s+default/.test(cleaned)
                  ? cleaned
                  : cleaned.replace(/^\s*function\s+(\w+)/, 'export default function $1');
                console.log('✅ Setting retry-generated component after sandbox error');
                setSandboxCode(ensured);
                setRenderError(null);
                return;
              }
            }
            // Fall back if retry fails
            console.log(`⚠️ Falling back after sandbox error retry ${nextRetry} failed`);
            setSandboxCode(null);
            setDynamicComponent(null);
            setFallbackContent(fallbackContent || content);
          });
        } else {
          // Max retries reached, use fallback
          console.log(`⚠️ Max retries (${MAX_RETRIES}) reached after sandbox error, using fallback`);
          setSandboxCode(null);
          setDynamicComponent(null);
          setFallbackContent(fallbackContent || content);
        }
      }
    };

    window.addEventListener('message', handler as any);
    return () => {
      window.removeEventListener('message', handler as any);
      window.clearTimeout(timer);
    };
  }, [sandboxCode]);

  // Render loading state
  if (isValidating || isGeneratingFallback) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-800 font-medium">
              {isGeneratingFallback ? 'Generating personalized UI...' : 'Loading dynamic content...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  // Handle sandbox render success - save code to database
  const handleSandboxRenderSuccess = () => {
    console.log('✅ Sandbox rendered successfully');
    if (pendingCodeToSave) {
      console.log('💾 Triggering database save for successfully rendered code');
      saveCodeToDatabase(pendingCodeToSave);
    }
  };

  // Handle sandbox render error - retry generation with error context
  const handleSandboxRenderError = (error: Error) => {
    const errorMsg = error.message;
    console.error('❌ Sandbox render failed:', errorMsg);
    
    // Store error for retry context
    setLastRenderError(errorMsg);
    setRenderError(errorMsg);
    
    // Clear the pending code since it failed to render
    setPendingCodeToSave(null);
    
    // Retry generation with error context if we haven't exceeded max retries
    if (generationRetryCount < MAX_RETRIES && content) {
      console.log(`🔄 Retrying UI Shell Generator due to render failure (${generationRetryCount + 1}/${MAX_RETRIES})...`);
      
      triggerUIShellGenerator(content, errorMsg).then((generatedComponent) => {
        if (generatedComponent) {
          const cleaned = sanitizeComponentCode(generatedComponent);
          if (/export\s+default/.test(cleaned) || /function\s+\w+\s*\(/.test(cleaned)) {
            const ensured = /export\s+default/.test(cleaned)
              ? cleaned
              : cleaned.replace(/^\s*function\s+(\w+)/, 'export default function $1');
            console.log('✅ Setting retry-generated component code for sandbox rendering');
            setSandboxCode(ensured);
            setRenderError(null);
            return;
          }
        }
        console.log(`⚠️ Falling back to manual content rendering after retry ${generationRetryCount}/${MAX_RETRIES}`);
        setFallbackContent(content);
      }).catch((retryError) => {
        console.error('❌ Retry generation failed:', retryError);
        setFallbackContent(content);
      });
    } else {
      console.log(`⚠️ Max retries (${MAX_RETRIES}) reached, falling back to manual rendering`);
      setFallbackContent(content);
    }
  };

  // Render sandboxed code component if provided
  if (sandboxCode) {
    console.log('🎯 Rendering sandbox component with code length:', sandboxCode.length);
    return (
      <div className={cn("space-y-6", className)}>
        {renderError && (
          <Card className="border-orange-200 bg-orange-50 mb-4">
            <CardContent className="p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-orange-800 font-medium">Rendering Issue Detected</p>
                  <p className="text-orange-700 text-sm mt-1">{renderError}</p>
                  {generationRetryCount > 0 && generationRetryCount < MAX_RETRIES && (
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      <p className="text-xs text-orange-600">
                        Retrying with error corrections... (Attempt {generationRetryCount + 1} of {MAX_RETRIES})
                      </p>
                    </div>
                  )}
                  {generationRetryCount >= MAX_RETRIES && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      Max retries ({MAX_RETRIES}) reached. Using fallback rendering.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <SandboxErrorBoundary 
          fallbackContent={fallbackContent || content}
          onError={handleSandboxRenderError}
          onSuccess={handleSandboxRenderSuccess}
        >
          <CodeSandboxRenderer
            componentCode={sandboxCode}
            stylePreferences={stylePreferences}
          />
        </SandboxErrorBoundary>
      </div>
    );
  }

  // Render error state with fallback
  if (renderError || !dynamicComponent) {
    return (
      <div className={cn("space-y-6", className)}>
        {renderError && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-orange-800 font-medium">Dynamic Rendering Unavailable</p>
                    <p className="text-orange-700 text-sm mt-1">
                      Using enhanced content rendering instead. All content remains fully accessible.
                    </p>
                  </div>
                </div>
                {onRegenerateCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerateCode}
                    className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100 flex-shrink-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <EnhancedContentRenderer
          content={fallbackContent || content}
          title={title}
          learningObjective={learningObjective}
          className={className}
        />
      </div>
    );
  }

  // Render dynamic component
  return (
    <div className={cn("space-y-6", className)}>
      <SecureDynamicRenderer
        component={dynamicComponent}
        stylePreferences={stylePreferences}
      />
    </div>
  );
}