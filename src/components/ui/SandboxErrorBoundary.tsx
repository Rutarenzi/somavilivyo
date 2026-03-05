import React from "react";
import { AlertTriangle } from "lucide-react";

interface SandboxErrorBoundaryProps {
  children: React.ReactNode;
  fallbackContent?: string;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

interface SandboxErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SandboxErrorBoundary extends React.Component<SandboxErrorBoundaryProps, SandboxErrorBoundaryState> {
  constructor(props: SandboxErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Sandbox Error Boundary caught error:', error, errorInfo);
    this.props.onError?.(error);
  }

  componentDidMount() {
    // If no error occurred during initial render, trigger success callback
    if (!this.state.hasError) {
      this.props.onSuccess?.();
    }
  }

  componentDidUpdate(prevProps: SandboxErrorBoundaryProps, prevState: SandboxErrorBoundaryState) {
    // If error was cleared and component successfully rendered, trigger success
    if (prevState.hasError && !this.state.hasError) {
      this.props.onSuccess?.();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 bg-orange-50 border-2 border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">
                Dynamic Content Rendering Issue
              </h3>
              <p className="text-orange-700 mb-3">
                The enhanced lesson content couldn't be displayed in its intended format. 
                Don't worry - the content is still fully accessible below.
              </p>
              
              {this.props.fallbackContent && (
                <div className="bg-white p-4 rounded border border-orange-200">
                  <div className="prose prose-sm max-w-none">
                    {this.props.fallbackContent.split('\n').map((line, index) => (
                      <p key={index} className="mb-2 last:mb-0">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-orange-600 hover:text-orange-800">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs bg-orange-100 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                  {this.state.error && String(this.state.error)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}