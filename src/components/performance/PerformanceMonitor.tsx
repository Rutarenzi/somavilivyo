import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Zap, Database } from 'lucide-react';
import { performanceCache } from '@/utils/performanceCache';
import { singleCache } from '@/utils/singleCache';

interface PerformanceStats {
  cacheHitRate: number;
  cacheSize: number;
  totalRequests: number;
  averageResponseTime: number;
  memoryUsage: number;
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  activeFetches: number;
}

interface PerformanceMonitorProps {
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  className 
}) => {
  const [stats, setStats] = useState<PerformanceStats>({
    cacheHitRate: 0,
    cacheSize: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    ttfb: 0,
    fcp: 0,
    activeFetches: 0,
  });

  const updateStats = useCallback(() => {
    try {
      // Get cache statistics
      const cacheStats = performanceCache.getStats();
      const singleCacheStats = singleCache.getStats();
      
      // Get navigation timing for TTFB
      let ttfb = 0;
      if (performance.timing) {
        ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      }

      // Get paint timing for FCP
      let fcp = 0;
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        fcp = fcpEntry.startTime;
      }

      // Get memory usage (if available)
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
      }

      setStats({
        cacheHitRate: cacheStats.hits && cacheStats.misses ? 
          (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100 : 0,
        cacheSize: cacheStats.size + singleCacheStats.size,
        totalRequests: (cacheStats.hits || 0) + (cacheStats.misses || 0),
        averageResponseTime: 0, // Would need request timing implementation
        memoryUsage,
        ttfb,
        fcp,
        activeFetches: 0, // Would need request tracking implementation
      });
    } catch (error) {
      console.warn('[PerformanceMonitor] Error updating stats:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    try {
      console.log('[PerformanceMonitor] Clearing all caches');
      performanceCache.clear();
      singleCache.clear();
      updateStats();
    } catch (error) {
      console.error('[PerformanceMonitor] Error clearing cache:', error);
    }
  }, [updateStats]);

  useEffect(() => {
    // Initial load
    updateStats();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, [updateStats]);

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value >= thresholds.good) return 'bg-green-500';
    if (value >= thresholds.fair) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLoadTimeColor = (time: number) => {
    if (time < 1000) return 'text-green-600';
    if (time < 2500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateStats}
            className="h-8 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCache}
            className="h-8 px-2"
          >
            Clear Cache
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Cache Performance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getPerformanceColor(stats.cacheHitRate, { good: 80, fair: 60 })} text-white border-0`}
              >
                {stats.cacheHitRate.toFixed(1)}%
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.cacheSize} cached items
            </div>
          </div>

          {/* Network Performance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">TTFB</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getLoadTimeColor(stats.ttfb)} border-current`}
              >
                {stats.ttfb.toFixed(0)}ms
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Time to First Byte
            </div>
          </div>

          {/* Paint Performance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">FCP</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getLoadTimeColor(stats.fcp)} border-current`}
              >
                {stats.fcp.toFixed(0)}ms
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              First Contentful Paint
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getPerformanceColor(100 - stats.memoryUsage, { good: 70, fair: 50 })} text-white border-0`}
              >
                {stats.memoryUsage.toFixed(1)}MB
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              JS Heap Size
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Total Cache Requests: {stats.totalRequests}</span>
            <span>Hit Rate: {stats.cacheHitRate.toFixed(1)}%</span>
          </div>
          
          {stats.cacheHitRate < 50 && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              ⚠️ Low cache hit rate detected. Consider reviewing caching strategy.
            </div>
          )}
          
          {stats.memoryUsage > 50 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              🚨 High memory usage detected. Consider optimizing components.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};