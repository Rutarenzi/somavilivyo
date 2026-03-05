interface ErrorReport {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  errorId: string;
  level: 'error' | 'warning' | 'info';
  metadata?: Record<string, any>;
}

class ErrorReportingService {
  private errorQueue: ErrorReport[] = [];
  private readonly maxQueueSize = 50;
  private isReporting = false;

  /**
   * Report an error with context information
   */
  reportError(
    error: Error | string,
    level: 'error' | 'warning' | 'info' = 'error',
    metadata?: {
      component?: string;
      userId?: string;
      additionalContext?: Record<string, any>;
    }
  ) {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      component: metadata?.component,
      userId: metadata?.userId,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.generateErrorId(),
      level,
      metadata: metadata?.additionalContext
    };

    // Add to queue
    this.errorQueue.push(errorReport);
    
    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${level.toUpperCase()}: ${errorReport.component || 'Unknown Component'}`);
      console.error('Message:', errorReport.message);
      console.error('Stack:', errorReport.stack);
      console.error('Context:', errorReport.metadata);
      console.error('Error ID:', errorReport.errorId);
      console.groupEnd();
    }

    // Batch send errors to avoid overwhelming the server
    this.scheduleReporting();

    return errorReport.errorId;
  }

  /**
   * Report a component render error
   */
  reportComponentError(
    error: Error,
    component: string,
    userId?: string,
    props?: Record<string, any>
  ) {
    return this.reportError(error, 'error', {
      component,
      userId,
      additionalContext: {
        type: 'component_render_error',
        props: this.sanitizeProps(props)
      }
    });
  }

  /**
   * Report a performance issue
   */
  reportPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    component?: string,
    userId?: string
  ) {
    return this.reportError(
      `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
      'warning',
      {
        component,
        userId,
        additionalContext: {
          type: 'performance_issue',
          metric,
          value,
          threshold
        }
      }
    );
  }

  /**
   * Report an API error
   */
  reportApiError(
    endpoint: string,
    status: number,
    response: any,
    userId?: string
  ) {
    return this.reportError(
      `API Error: ${endpoint} returned ${status}`,
      'error',
      {
        userId,
        additionalContext: {
          type: 'api_error',
          endpoint,
          status,
          response: typeof response === 'object' ? JSON.stringify(response) : response
        }
      }
    );
  }

  /**
   * Get recent error reports for debugging
   */
  getRecentErrors(limit = 10): ErrorReport[] {
    return this.errorQueue.slice(-limit);
  }

  /**
   * Clear error queue
   */
  clearErrors() {
    this.errorQueue = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentErrors = this.errorQueue.filter(e => e.timestamp.getTime() > lastHour);
    const dailyErrors = this.errorQueue.filter(e => e.timestamp.getTime() > last24Hours);

    const errorsByLevel = this.errorQueue.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByComponent = this.errorQueue.reduce((acc, error) => {
      const component = error.component || 'Unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errorQueue.length,
      lastHour: recentErrors.length,
      last24Hours: dailyErrors.length,
      byLevel: errorsByLevel,
      byComponent: errorsByComponent
    };
  }

  private generateErrorId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeProps(props?: Record<string, any>): Record<string, any> | undefined {
    if (!props) return undefined;
    
    // Remove sensitive information and large objects
    const sanitized: Record<string, any> = {};
    
    Object.entries(props).forEach(([key, value]) => {
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'function') {
        sanitized[key] = '[FUNCTION]';
      } else if (typeof value === 'object' && value !== null) {
        // Limit object depth to prevent large payloads
        try {
          sanitized[key] = JSON.parse(JSON.stringify(value).substring(0, 1000));
        } catch {
          sanitized[key] = '[COMPLEX_OBJECT]';
        }
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  private scheduleReporting() {
    if (this.isReporting || this.errorQueue.length === 0) return;

    // Debounce reporting to batch errors
    setTimeout(() => {
      this.sendErrorsToServer();
    }, 5000);
  }

  private async sendErrorsToServer() {
    if (this.isReporting || this.errorQueue.length === 0) return;

    this.isReporting = true;

    try {
      // In a real application, you would send to your error tracking service
      // For now, we'll just clear the queue and log
      const errorsToSend = [...this.errorQueue];
      
      console.log(`📊 Would send ${errorsToSend.length} error reports to monitoring service`);
      
      // Clear sent errors
      this.errorQueue = [];
      
    } catch (error) {
      console.error('Failed to send error reports:', error);
    } finally {
      this.isReporting = false;
    }
  }
}

// Singleton instance
export const errorReporting = new ErrorReportingService();

// Global error handler
window.addEventListener('error', (event) => {
  errorReporting.reportError(event.error || event.message, 'error', {
    additionalContext: {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorReporting.reportError(
    event.reason instanceof Error ? event.reason : String(event.reason),
    'error',
    {
      additionalContext: {
        type: 'unhandled_promise_rejection'
      }
    }
  );
});
