
import React from 'react';

// Performance utilities for optimizing course learning interface
export interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.startTime}ms`);
        }
      });
      
      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint timing not supported');
      }

      // Observe navigation timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Navigation timing:', entry);
        }
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation timing not supported');
      }
    }
  }

  startMeasurement(name: string) {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMeasurement(name: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure ? measure.duration : 0;
    }
    return 0;
  }

  recordMetrics(componentCount: number) {
    const metrics: PerformanceMetrics = {
      renderTime: this.endMeasurement('component-render'),
      componentCount,
      memoryUsage: this.getMemoryUsage(),
      timestamp: Date.now()
    };

    this.metrics.push(metrics);
    return metrics;
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return total / this.metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const withPerformanceTracking = (componentName: string) => {
  return function <T extends React.ComponentType<any>>(Component: T): T {
    const PerformanceTrackedComponent = (props: any) => {
      performanceMonitor.startMeasurement(`${componentName}-render`);
      
      React.useEffect(() => {
        performanceMonitor.endMeasurement(`${componentName}-render`);
      });

      return React.createElement(Component, props);
    };

    PerformanceTrackedComponent.displayName = `withPerformanceTracking(${componentName})`;
    return PerformanceTrackedComponent as T;
  };
};
