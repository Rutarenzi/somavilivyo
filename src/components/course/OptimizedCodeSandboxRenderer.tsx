import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { SandboxErrorBoundary } from '@/components/ui/SandboxErrorBoundary';
import { errorReporting } from '@/utils/errorReporting';

interface OptimizedCodeSandboxRendererProps {
  componentCode: string;
  stylePreferences?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
    animationStyle?: string;
    layoutStyle?: string;
  };
  className?: string;
  onRenderSuccess?: () => void;
  onRenderError?: (error: Error) => void;
}

export const OptimizedCodeSandboxRenderer: React.FC<OptimizedCodeSandboxRendererProps> = ({ 
  componentCode, 
  stylePreferences = {}, 
  className,
  onRenderSuccess,
  onRenderError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout>();

  // Validate input early
  const isValidCode = componentCode && 
    typeof componentCode === 'string' && 
    componentCode.trim().length > 0;

  const sanitizeComponentCode = useCallback((code: string): string => {
    if (!code || typeof code !== 'string') return '';
    
    try {
      let out = code.trim();
      if (out.length === 0) return '';
      
      // Strip markdown code fences
      out = out.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();
      
      // Handle JSON-wrapped components
      try {
        const parsed = JSON.parse(out);
        if (parsed && typeof parsed.component === 'string') {
          out = parsed.component.trim();
        }
      } catch {
        // Continue with original string
      }
      
      if (out.length === 0) return '';
      
      // Security: Remove imports and make self-contained
      out = out.replace(/^import\s+.*?;$/gm, '');
      
      // FIX: Correct malformed style attributes - common AI generation bug
      // Fix: style={{"{{...}}"}} -> style={{...}}
      out = out.replace(/style=\{\{"\{\{([^}]+)\}\}"\}\}/g, 'style={{$1}}');
      // Fix: style={{"{...}"}} -> style={{...}}
      out = out.replace(/style=\{\{"\{([^}]+)\}"\}\}/g, 'style={{$1}}');
      // Fix: style={{"..."}} -> style="..."
      out = out.replace(/style=\{\{"([^"]+)"\}\}/g, 'style="$1"');
      
      // Ensure default export
      if (!/export\s+default/.test(out)) {
        if (/function\s+LessonContent\s*\(/.test(out)) {
          out = out.replace(/^\s*function\s+LessonContent/, 'export default function LessonContent');
        } else if (/function\s+\w+\s*\(/.test(out)) {
          out = out.replace(/^\s*function\s+(\w+)/, 'export default function $1');
        }
      }
      
      // Replace motion components with regular divs for safety
      out = out.replace(/motion\./g, '');
      out = out.replace(/<motion\s+/g, '<');
      out = out.replace(/\{\.\.\.[\w\s]+\}/g, '');
      
      return out.trim();
    } catch (err) {
      errorReporting.reportError(
        err instanceof Error ? err : new Error('Code sanitization failed'),
        'warning',
        { component: 'OptimizedCodeSandboxRenderer' }
      );
      return '';
    }
  }, []);

  const buildSandboxDocument = useCallback((cleanedCode: string): string => {
    const fonts = stylePreferences.fontFamily 
      ? `<link rel="preconnect" href="https://fonts.googleapis.com">
         <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
         <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(stylePreferences.fontFamily)}:wght@400;600;700&display=swap" rel="stylesheet">`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dynamic Lesson</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  ${fonts}
  <style>
    :root {
      --theme-primary: ${stylePreferences.primaryColor || '#6366f1'};
      --theme-secondary: ${stylePreferences.secondaryColor || '#10b981'};
      --theme-font: ${stylePreferences.fontFamily || 'Inter, system-ui, sans-serif'};
      --theme-font-size: ${
        stylePreferences.fontSize === 'sm' ? '14px' : 
        stylePreferences.fontSize === 'lg' ? '18px' : 
        stylePreferences.fontSize === 'xl' ? '20px' : '16px'
      };
    }
    html, body, #root { height: 100%; margin: 0; }
    body { 
      font-family: var(--theme-font); 
      font-size: var(--theme-font-size); 
      background: #ffffff;
      overflow-x: hidden;
    }
    .render-container {
      padding: 16px;
      max-width: 100%;
      overflow-wrap: break-word;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Enhanced error handling
    window.addEventListener('error', function(e) {
      console.error('Sandbox error:', e);
      const root = document.getElementById('root');
      if (root && !root.innerHTML.includes('error')) {
        root.innerHTML = '<div class="render-container" style="color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;">Render error: ' + (e.message || 'Unknown error') + '</div>';
      }
      try {
        window.parent && window.parent.postMessage({ 
          source: 'codesandbox', 
          type: 'sandbox-error', 
          error: e.message 
        }, '*');
      } catch(_) {}
    });

    // Tailwind configuration for animations
    if (window.tailwind) {
      window.tailwind.config = {
        theme: {
          extend: {
            keyframes: {
              'fade-in': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
              'slide-in-right': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
              'scale-in': { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
            },
            animation: {
              'fade-in': 'fade-in 0.3s ease-out',
              'slide-in-right': 'slide-in-right 0.3s ease-out',
              'scale-in': 'scale-in 0.2s ease-out',
            }
          }
        }
      };
    }

    // Component transpilation and mounting
    (function() {
      try {
        console.log('🚀 Starting optimized component rendering');
        const code = ${JSON.stringify(cleanedCode).replace(/<\/script>/g, '<\\/script>')};
        
        if (!code || code.trim().length === 0) {
          throw new Error('No valid component code provided');
        }
        
        const transformed = Babel.transform(code, { 
          presets: [["env", { modules: "commonjs" }], "react", "typescript"] 
        }).code;
        
        const exports = {};
        const module = { exports };
        const fn = new Function('React', 'ReactDOM', 'exports', 'module', transformed + ';return module.exports || exports;');
        const mod = fn(React, ReactDOM, exports, module);
        const Component = mod && (mod.default || mod.LessonContent || mod.Component || mod.App);
        
        if (typeof Component === 'function') {
          console.log('✅ Component found, mounting with container...');
          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(React.createElement('div', { className: 'render-container' }, React.createElement(Component)));
          
          // Notify parent of successful render
          try {
            window.parent && window.parent.postMessage({ 
              source: 'codesandbox', 
              type: 'sandbox-ready' 
            }, '*');
          } catch(_) {}
        } else {
          throw new Error('No valid React component found. Ensure your code exports a default function component.');
        }
      } catch (e) {
        console.error('❌ Sandbox rendering failed:', e);
        const root = document.getElementById('root');
        if (root) {
          root.innerHTML = '<div class="render-container" style="color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;"><strong>Component Error:</strong> ' + (e.message || String(e)) + '</div>';
        }
        try {
          window.parent && window.parent.postMessage({ 
            source: 'codesandbox', 
            type: 'sandbox-error', 
            error: e.message || String(e) 
          }, '*');
        } catch(_) {}
      }
    })();
  </script>
</body>
</html>`;
  }, [stylePreferences]);

  useEffect(() => {
    if (!isValidCode) {
      setError('Invalid component code provided');
      setIsLoading(false);
      return;
    }

    const cleanedCode = sanitizeComponentCode(componentCode);
    
    if (!cleanedCode) {
      setError('Unable to process component code');
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    // Set timeout for render - increased to 20 seconds for complex components
    renderTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        const timeoutError = 'Component render timeout after 20 seconds';
        console.error('⏳', timeoutError);
        setError(timeoutError);
        setIsLoading(false);
        onRenderError?.(new Error(timeoutError));
      }
    }, 20000); // Increased from 10s to 20s

    // Listen for iframe messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source !== 'codesandbox') return;
      
      clearTimeout(renderTimeoutRef.current);
      
      if (event.data.type === 'sandbox-ready') {
        setIsLoading(false);
        setError(null);
        onRenderSuccess?.();
      } else if (event.data.type === 'sandbox-error') {
        setIsLoading(false);
        setError(event.data.error || 'Rendering failed');
        onRenderError?.(new Error(event.data.error));
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      clearTimeout(renderTimeoutRef.current);
      window.removeEventListener('message', handleMessage);
    };
  }, [componentCode, isValidCode, sanitizeComponentCode, isLoading, onRenderSuccess, onRenderError]);

  if (!isValidCode) {
    return (
      <div className={cn('w-full p-6 bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg', className)}>
        <div className="text-center text-muted-foreground">
          <p>No valid component code provided</p>
        </div>
      </div>
    );
  }

  const cleanedCode = sanitizeComponentCode(componentCode);
  const html = buildSandboxDocument(cleanedCode);

  return (
    <SandboxErrorBoundary fallbackContent={componentCode}>
      <div className={cn('w-full relative', className)}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg z-10">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Rendering component...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="w-full p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <strong>Render Error:</strong> {error}
          </div>
        )}
        
        {!error && (
          <iframe
            ref={iframeRef}
            title="Dynamic Lesson Content"
            className="w-full border-0 rounded-lg shadow-sm bg-background"
            style={{ minHeight: 400, height: 'auto' }}
            sandbox="allow-scripts allow-same-origin"
            srcDoc={html}
          />
        )}
      </div>
    </SandboxErrorBoundary>
  );
};