import React from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  renderTime: number;
  apiResponseTime: number;
  bundleSize: number;
  memoryUsage: number;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static thresholds: PerformanceThresholds = {
    renderTime: 100,
    apiResponseTime: 2000,
    bundleSize: 5 * 1024 * 1024, // 5MB
    memoryUsage: 100 * 1024 * 1024 // 100MB
  };

  static startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        metadata: { type: 'timing' }
      });

      // Warn if timing exceeds thresholds
      if (name.includes('render') && duration > this.thresholds.renderTime) {
        console.warn(`Slow render detected: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      if (name.includes('api') && duration > this.thresholds.apiResponseTime) {
        console.warn(`Slow API response: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  static getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  static getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  static clearMetrics(): void {
    this.metrics = [];
  }

  static monitorComponentRender<T extends object>(
    WrappedComponent: React.ComponentType<T>,
    componentName: string
  ): React.ComponentType<T> {
    return function MonitoredComponent(props: T) {
      const endTiming = PerformanceMonitor.startTiming(`${componentName}_render`);
      
      React.useEffect(() => {
        endTiming();
      });

      return React.createElement(WrappedComponent, props);
    };
  }

  static async monitorApiCall<T>(
    apiCall: () => Promise<T>,
    callName: string
  ): Promise<T> {
    const endTiming = this.startTiming(`api_${callName}`);
    
    try {
      const result = await apiCall();
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      this.recordMetric({
        name: `api_${callName}_error`,
        value: 1,
        timestamp: Date.now(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      throw error;
    }
  }

  static checkMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedJSHeapSize = memory.usedJSHeapSize;
      
      this.recordMetric({
        name: 'memory_usage',
        value: usedJSHeapSize,
        timestamp: Date.now(),
        metadata: {
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      });

      if (usedJSHeapSize > this.thresholds.memoryUsage) {
        console.warn(`High memory usage detected: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }

  static getPerformanceReport(): {
    averageRenderTime: number;
    averageApiTime: number;
    memoryUsage: number;
    errorCount: number;
    recommendations: string[];
  } {
    const renderMetrics = this.metrics.filter(m => m.name.includes('render'));
    const apiMetrics = this.metrics.filter(m => m.name.includes('api') && !m.name.includes('error'));
    const errorMetrics = this.metrics.filter(m => m.name.includes('error'));
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory_usage');

    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 0;

    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const latestMemoryUsage = memoryMetrics.length > 0
      ? memoryMetrics[memoryMetrics.length - 1].value
      : 0;

    const recommendations: string[] = [];
    
    if (averageRenderTime > this.thresholds.renderTime) {
      recommendations.push('Consider optimizing component renders with React.memo or useMemo');
    }
    
    if (averageApiTime > this.thresholds.apiResponseTime) {
      recommendations.push('Consider implementing API caching or optimizing backend responses');
    }
    
    if (latestMemoryUsage > this.thresholds.memoryUsage) {
      recommendations.push('Consider implementing virtual scrolling or lazy loading for large datasets');
    }
    
    if (errorMetrics.length > 10) {
      recommendations.push('High error rate detected - review error handling and API stability');
    }

    return {
      averageRenderTime,
      averageApiTime,
      memoryUsage: latestMemoryUsage,
      errorCount: errorMetrics.length,
      recommendations
    };
  }
}

// Auto-monitor memory usage every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    PerformanceMonitor.checkMemoryUsage();
  }, 30000);
}
