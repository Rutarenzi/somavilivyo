import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Badge } from './badge';

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  componentName?: string;
  level?: 'critical' | 'warning' | 'info';
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  errorCount: number;
}

export class EnhancedErrorBoundary extends Component<EnhancedErrorBoundaryProps, EnhancedErrorBoundaryState> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[EnhancedErrorBoundary] ${this.props.componentName || 'Component'} error:`, {
      error,
      errorInfo,
      errorId: this.state.errorId,
      retryCount: this.retryCount
    });

    // Report to external error tracking service if available
    this.props.onError?.(error, errorInfo);

    // Track error frequency
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorId: ''
      });
    }
  };

  handleReset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorId: '',
      errorCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.retryCount < this.maxRetries;
      const level = this.props.level || 'critical';

      return (
        <Card className={`max-w-2xl mx-auto my-8 ${
          level === 'critical' ? 'border-destructive' : 
          level === 'warning' ? 'border-warning' : 'border-muted'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className={`h-6 w-6 mt-1 flex-shrink-0 ${
                level === 'critical' ? 'text-destructive' : 
                level === 'warning' ? 'text-warning' : 'text-muted-foreground'
              }`} />
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg text-foreground">
                    {this.props.componentName || 'Component'} Error
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={level === 'critical' ? 'destructive' : 'secondary'}>
                      {level.toUpperCase()}
                    </Badge>
                    {this.state.errorCount > 1 && (
                      <Badge variant="outline">
                        {this.state.errorCount} errors
                      </Badge>
                    )}
                  </div>
                </div>
                
                <p className="text-muted-foreground">
                  An unexpected error occurred while rendering this component. 
                  {canRetry ? ' Try again or reload the page.' : ' Please reload the page.'}
                  {this.state.errorCount > 1 && ' This error has occurred multiple times.'}
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center space-x-2">
                      <Bug className="h-4 w-4" />
                      <span>Error Details (Development Mode)</span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="p-3 bg-muted rounded text-xs">
                        <div className="font-medium text-destructive mb-1">Error ID:</div>
                        <div className="font-mono">{this.state.errorId}</div>
                      </div>
                      <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-48 text-destructive">
                        {this.state.error.message}
                        {this.state.error.stack && (
                          <>
                            {'\n\nStack Trace:\n'}
                            {this.state.error.stack}
                          </>
                        )}
                      </pre>
                    </div>
                  </details>
                )}
                
                <div className="flex space-x-3">
                  {canRetry && (
                    <Button onClick={this.handleRetry} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again ({this.maxRetries - this.retryCount} left)
                    </Button>
                  )}
                  <Button onClick={this.handleReset} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Component
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                    Reload Page
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}