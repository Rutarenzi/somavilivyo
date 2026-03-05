import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { errorReporting } from '@/utils/errorReporting';

interface CriticalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  showHomeButton?: boolean;
  showReloadButton?: boolean;
  maxRetries?: number;
  componentName?: string;
}

interface CriticalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  errorTimestamp: Date | null;
}

/**
 * Critical Error Boundary for wrapping entire application sections
 * Provides comprehensive error reporting and recovery options
 */
export class CriticalErrorBoundary extends Component<CriticalErrorBoundaryProps, CriticalErrorBoundaryState> {
  private readonly maxRetries: number;

  constructor(props: CriticalErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries || 2;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      errorTimestamp: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<CriticalErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorTimestamp: new Date()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = errorReporting.reportComponentError(
      error,
      this.props.componentName || 'CriticalErrorBoundary',
      undefined, // userId would be passed from context in real app
      {
        errorInfo: errorInfo.componentStack,
        retryCount: this.state.retryCount
      }
    );

    this.setState({
      errorInfo,
      errorId
    });

    // Log to console for debugging
    console.group(`🚨 CRITICAL ERROR in ${this.props.componentName || 'Application'}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error ID:', errorId);
    console.error('Retry Count:', this.state.retryCount);
    console.groupEnd();
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
        errorTimestamp: null
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      errorTimestamp: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isRepeatedError = this.state.retryCount > 0;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <CardTitle className="text-xl text-destructive">
                      Critical Application Error
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {this.props.componentName || 'A critical component'} has encountered an error
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <Badge variant="destructive">CRITICAL</Badge>
                  {isRepeatedError && (
                    <Badge variant="outline" className="text-xs">
                      Retry {this.state.retryCount}/{this.maxRetries}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h4 className="font-medium text-destructive mb-2">What happened?</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  An unexpected error occurred that prevented this part of the application from working properly.
                  {isRepeatedError && ' This error has occurred multiple times.'}
                </p>
                
                {this.state.error && (
                  <div className="bg-background border rounded p-3">
                    <p className="text-sm font-mono text-destructive">
                      {this.state.error.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center">
                  <Bug className="h-4 w-4 mr-2" />
                  What can you do?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Try refreshing the page or retrying the operation</li>
                  <li>• Check your internet connection</li>
                  <li>• Try again in a few minutes</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              {/* Error Details for Development/Support */}
              {(process.env.NODE_ENV === 'development' || this.state.errorId) && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
                    Technical Details
                  </summary>
                  <div className="space-y-2">
                    {this.state.errorId && (
                      <div className="bg-muted rounded p-2">
                        <span className="font-medium">Error ID:</span>
                        <code className="ml-2 font-mono">{this.state.errorId}</code>
                      </div>
                    )}
                    {this.state.errorTimestamp && (
                      <div className="bg-muted rounded p-2">
                        <span className="font-medium">Timestamp:</span>
                        <code className="ml-2 font-mono">{this.state.errorTimestamp.toISOString()}</code>
                      </div>
                    )}
                    {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                      <pre className="bg-muted rounded p-2 overflow-auto max-h-32 text-destructive">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canRetry && (
                  <Button onClick={this.handleRetry} variant="default">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}
                
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Component
                </Button>

                {this.props.showReloadButton !== false && (
                  <Button onClick={this.handleReload} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                )}

                {this.props.showHomeButton && (
                  <Button onClick={this.handleGoHome} variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                )}
              </div>

              {/* Additional Help */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  If this error continues to occur, please contact our support team with the error ID above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}