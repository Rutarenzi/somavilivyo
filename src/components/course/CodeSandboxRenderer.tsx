import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CodeSandboxRendererProps {
  componentCode: string; // React/TSX component code as string (expects export default or assigns to module.exports)
  stylePreferences?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: string; // 'sm' | 'base' | 'lg' | 'xl'
    animationStyle?: string; // 'fade' | 'slide' | 'scale' | 'bounce'
    layoutStyle?: string; // 'single-column' | 'two-column' | 'card-layout' | 'magazine'
  };
  className?: string;
}

// Renders React component code in a sandboxed iframe using Babel Standalone
export const CodeSandboxRenderer: React.FC<CodeSandboxRendererProps> = ({ componentCode, stylePreferences = {}, className }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Early return for invalid input
  if (!componentCode || typeof componentCode !== 'string' || componentCode.trim().length === 0) {
    return (
      <div className={cn('w-full p-6 bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg', className)}>
        <div className="text-center text-muted-foreground">
          <p>No valid component code provided</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering sandboxed code component, length:', componentCode.length);
  console.log('🔍 Component code preview:', componentCode.substring(0, 100) + '...');

  // Sanitize and make component code self-contained
  const sanitizeComponentCode = (code: string): string => {
    if (!code || typeof code !== 'string') return '';
    let out = code.trim();
    
    if (out.length === 0) return '';
    
    // Strip markdown code fences
    out = out.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```\s*$/, '').trim();
    
    // If JSON-wrapped { component: "..." }
    try {
      const maybe = JSON.parse(out);
      if (maybe && typeof maybe.component === 'string') {
        out = maybe.component.trim();
      }
    } catch {
      // Continue with original string if JSON parsing fails
    }
    
    if (out.length === 0) return '';
    
    // Remove all imports - make it self-contained
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
    
    // Replace any framer-motion references with simple divs
    out = out.replace(/motion\./g, '');
    out = out.replace(/<motion\s+/g, '<');
    out = out.replace(/\{\.\.\.[\w\s]+\}/g, '');
    
    return out.trim();
  };

  const cleanedCode = sanitizeComponentCode(componentCode);
  
  // Additional safety check for cleaned code
  if (!cleanedCode || cleanedCode.length === 0) {
    return (
      <div className={cn('w-full p-6 bg-muted/50 border-2 border-dashed border-muted-foreground/20 rounded-lg', className)}>
        <div className="text-center text-muted-foreground">
          <p>Unable to process component code</p>
        </div>
      </div>
    );
  }
  
  console.log('🧹 Cleaned code for sandbox:', {
    originalLength: componentCode.length,
    cleanedLength: cleanedCode.length,
    hasExportDefault: /export\s+default/.test(cleanedCode),
    hasFunction: /function\s+\w+/.test(cleanedCode),
    preview: cleanedCode.substring(0, 150) + '...'
  });

  // Build sandbox document using srcDoc to avoid cross-origin restrictions
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dynamic Lesson</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  ${stylePreferences.fontFamily ? `<link rel="preconnect" href="https://fonts.googleapis.com">` : ''}
  ${stylePreferences.fontFamily ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` : ''}
  ${stylePreferences.fontFamily ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(stylePreferences.fontFamily)}:wght@400;600;700&display=swap" rel="stylesheet">` : ''}
  <style>
    :root {
      --theme-primary: ${stylePreferences.primaryColor || '#6366f1'};
      --theme-secondary: ${stylePreferences.secondaryColor || '#10b981'};
      --theme-font: ${stylePreferences.fontFamily || 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'};
      --theme-font-size: ${stylePreferences.fontSize === 'sm' ? '14px' : stylePreferences.fontSize === 'lg' ? '18px' : stylePreferences.fontSize === 'xl' ? '20px' : '16px'};
    }
    html, body, #root { height: 100%; }
    body { margin: 0; font-family: var(--theme-font); font-size: var(--theme-font-size); background: #ffffff; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/javascript">
    window.addEventListener('error', function(e){
      console.error('🔴 Global error:', e);
      const root = document.getElementById('root');
      if (root) root.innerHTML = '<div style="padding:16px;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;">Render error: ' + (e.message || 'Unknown error') + '</div>';
    });
  </script>
  <script type="text/javascript">
    // Tailwind config minimal for animations
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
      }
    }
  </script>
  <script type="text/javascript">
    // Prepare a mounting helper accessible to user code if needed
    window.__mount = function(Comp){
      const rootEl = document.getElementById('root');
      if (!rootEl) return;
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(Comp));
    };
  </script>
  <script type="text/javascript">
    // Send early ready signal
    try { 
      window.parent && window.parent.postMessage({ source: 'codesandbox', type: 'sandbox-init' }, '*'); 
      console.log('📡 Sent sandbox-init signal');
    } catch(_) {}
    
    // Store component code in global variable to avoid HTML parsing issues
    window.__componentCode = ${JSON.stringify(cleanedCode)};
    
    // User component transpile & mount
    (function(){
      try {
        console.log('🚀 Starting component transpilation and mounting');
        
        const rawCode = window.__componentCode;
        if (!rawCode) {
          throw new Error('No component code found');
        }
        
        console.log('📝 Code to transpile length:', rawCode.length);
        console.log('📝 Code preview:', rawCode.substring(0, 200) + '...');
        
        // Try multiple Babel preset combinations
        let transformed;
        const presetOptions = [
          { presets: ['react', 'typescript'] },
          { presets: [['env', { modules: 'commonjs' }], 'react'] },
          { presets: ['react'] }
        ];
        
        for (let i = 0; i < presetOptions.length; i++) {
          try {
            console.log('🔄 Trying Babel preset option ' + (i + 1));
            transformed = Babel.transform(rawCode, presetOptions[i]).code;
            console.log('✅ Code transformed successfully with preset', i + 1);
            break;
          } catch (babelError) {
            console.warn('⚠️ Babel preset ' + (i + 1) + ' failed:', babelError.message);
            if (i === presetOptions.length - 1) throw babelError;
          }
        }
        
        if (!transformed) {
          throw new Error('All Babel transformations failed');
        }
        
        console.log('🔧 Transformed code preview:', transformed.substring(0, 200) + '...');
        
        const exports = {};
        const module = { exports };
        const fn = new Function('React', 'exports', 'module', transformed + ';return module.exports || exports;');
        const mod = fn(React, exports, module);
        const Comp = mod && (mod.default || mod.LessonContent || mod.Component || mod.App);
        
        console.log('🔍 Module evaluation result:', {
          hasModule: !!mod,
          hasDefault: !!mod?.default,
          hasLessonContent: !!mod?.LessonContent,
          componentType: typeof Comp,
          moduleKeys: mod ? Object.keys(mod) : []
        });
        
        if (typeof Comp === 'function') {
          console.log('✅ Found valid component, mounting...');
          window.__mount(Comp);
          console.log('🎉 Component mounted successfully');
          
          // Wait for DOM to render, then extract text content for audio
          setTimeout(function() {
            try {
              const bodyClone = document.body.cloneNode(true);
              // Remove scripts, styles, code blocks
              const elementsToRemove = bodyClone.querySelectorAll('script, style, code, pre');
              elementsToRemove.forEach(function(el) { el.remove(); });
              
              const textContent = bodyClone.textContent || '';
              const cleanText = textContent.replace(/\\s+/g, ' ').trim();
              
              console.log('📝 Extracted text for audio, length:', cleanText.length);
              
              // Send both ready signal and content
              window.parent && window.parent.postMessage({ 
                source: 'codesandbox', 
                type: 'sandbox-ready'
              }, '*');
              
              window.parent && window.parent.postMessage({
                type: 'iframe-content',
                html: document.body.innerHTML,
                text: cleanText
              }, '*');
              
              console.log('📡 Sent sandbox-ready and content signals');
            } catch(err) {
              console.warn('Failed to extract content:', err);
            }
          }, 500);
        } else if (typeof window.LessonContent === 'function') {
          console.log('✅ Found global LessonContent, mounting...');
          window.__mount(window.LessonContent);
          console.log('🎉 Global component mounted successfully');
          
          // Wait for DOM to render, then extract text content for audio
          setTimeout(function() {
            try {
              const bodyClone = document.body.cloneNode(true);
              const elementsToRemove = bodyClone.querySelectorAll('script, style, code, pre');
              elementsToRemove.forEach(function(el) { el.remove(); });
              
              const textContent = bodyClone.textContent || '';
              const cleanText = textContent.replace(/\\s+/g, ' ').trim();
              
              window.parent && window.parent.postMessage({ 
                source: 'codesandbox', 
                type: 'sandbox-ready'
              }, '*');
              
              window.parent && window.parent.postMessage({
                type: 'iframe-content',
                html: document.body.innerHTML,
                text: cleanText
              }, '*');
              
              console.log('📡 Sent sandbox-ready and content signals');
            } catch(err) {
              console.warn('Failed to extract content:', err);
            }
          }, 500);
        } else {
          console.error('❌ No valid component found for mounting');
          const root = document.getElementById('root');
          if (root) root.innerHTML = '<div style="padding:16px;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;">No default export found. Ensure your code uses <code>export default function LessonContent(){...}</code></div>';
          try { 
            window.parent && window.parent.postMessage({ source: 'codesandbox', type: 'sandbox-error', error: 'no-default-export' }, '*'); 
            console.log('📡 Sent sandbox-error signal: no-default-export');
          } catch(_) {}
        }
      } catch (e) {
        console.error('❌ Sandbox rendering error:', e);
        const root = document.getElementById('root');
        if (root) root.innerHTML = '<div style="padding:16px;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;border-radius:8px;">Build error: ' + (e && e.message ? e.message : String(e)) + '</div>';
        try { 
          window.parent && window.parent.postMessage({ source: 'codesandbox', type: 'sandbox-error', error: (e && e.message) ? e.message : String(e) }, '*'); 
          console.log('📡 Sent sandbox-error signal:', e.message);
        } catch(_) {}
      }
    })();
  </script>
</body>
</html>`;

  return (
    <div className={cn('w-full', className)}>
      <iframe
        ref={iframeRef}
        title="Dynamic Lesson"
        className="w-full border-0 rounded-lg shadow-soft bg-transparent"
        style={{ minHeight: 600 }}
        sandbox="allow-scripts allow-same-origin"
        srcDoc={html}
      />
    </div>
  );
};