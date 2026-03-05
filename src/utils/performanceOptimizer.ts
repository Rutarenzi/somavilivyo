import { performanceCache } from './performanceCache';

// Critical resource preloader
export class ResourcePreloader {
  private loadedResources = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();

  async preloadCriticalData(courseId: string, userId: string) {
    const keys = [
      `course_detail_${courseId}`,
      `progress_${userId}_${courseId}`,
      `analytics_${courseId}`
    ];

    const preloadPromises = keys.map(key => this.preloadResource(key));
    await Promise.allSettled(preloadPromises);
  }

  private async preloadResource(key: string): Promise<void> {
    if (this.loadedResources.has(key) || this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    const promise = this.fetchResource(key);
    this.loadingPromises.set(key, promise);

    try {
      await promise;
      this.loadedResources.add(key);
    } catch (error) {
      console.warn(`Failed to preload resource: ${key}`, error);
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private async fetchResource(key: string): Promise<any> {
    // Simulate resource fetching - in real implementation,
    // this would fetch from appropriate APIs
    return new Promise(resolve => {
      setTimeout(() => {
        performanceCache.setImmediate(key, `preloaded_${key}`);
        resolve(`preloaded_${key}`);
      }, 10);
    });
  }
}

// Lazy loading manager for components
export class LazyLoadManager {
  private observer: IntersectionObserver | null = null;
  private loadedComponents = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const componentId = entry.target.getAttribute('data-component-id');
              if (componentId && !this.loadedComponents.has(componentId)) {
                this.loadComponent(componentId);
                this.observer?.unobserve(entry.target);
              }
            }
          });
        },
        { rootMargin: '100px' } // Load 100px before entering viewport
      );
    }
  }

  observeComponent(element: Element, componentId: string) {
    if (this.observer) {
      element.setAttribute('data-component-id', componentId);
      this.observer.observe(element);
    }
  }

  private loadComponent(componentId: string) {
    this.loadedComponents.add(componentId);
    // Trigger component loading
    window.dispatchEvent(new CustomEvent('loadLazyComponent', {
      detail: { componentId }
    }));
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Performance metrics collector
export class PerformanceMetrics {
  private metrics = new Map<string, number[]>();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getMetricReport() {
    const report: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [name, values] of this.metrics) {
      report[name] = {
        average: this.getAverageMetric(name),
        count: values.length,
        latest: values[values.length - 1] || 0
      };
    }
    
    return report;
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// Bundle size optimizer
export class BundleOptimizer {
  private importedModules = new Set<string>();

  async dynamicImport<T>(moduleId: string, importFn: () => Promise<T>): Promise<T> {
    if (this.importedModules.has(moduleId)) {
      // Module already imported, return from cache if possible
      return importFn();
    }

    const startTime = performance.now();
    const module = await importFn();
    const loadTime = performance.now() - startTime;
    
    this.importedModules.add(moduleId);
    
    // Record import performance
    console.log(`📦 Dynamic import '${moduleId}' loaded in ${loadTime.toFixed(2)}ms`);
    
    return module;
  }

  getImportedModules(): string[] {
    return Array.from(this.importedModules);
  }
}

// Global performance optimizer instance
export const resourcePreloader = new ResourcePreloader();
export const lazyLoadManager = new LazyLoadManager();
export const performanceMetrics = new PerformanceMetrics();
export const bundleOptimizer = new BundleOptimizer();

// Performance monitoring wrapper
export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  metricName: string
): T => {
  return ((...args: any[]) => {
    const startTime = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        performanceMetrics.recordMetric(metricName, duration);
      });
    } else {
      const duration = performance.now() - startTime;
      performanceMetrics.recordMetric(metricName, duration);
      return result;
    }
  }) as T;
};
