import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { performanceCache, optimizedCache } from '@/utils/performanceCache';
import { Activity, Database, Zap, RefreshCw } from 'lucide-react';

interface PerformanceMonitorProps {
  className?: string;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ className }) => {
  const [stats, setStats] = useState({
    cache: { hits: 0, misses: 0, size: 0 },
    timing: { ttfb: 0, fcp: 0, lcp: 0 },
    memory: { used: 0, total: 0 }
  });

  const updateStats = () => {
    // Cache stats
    const cacheStats = performanceCache.getStats();
    
    // Performance timing
    const perfTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
    
    // Memory usage (if available)
    const memoryInfo = (performance as any).memory;
    
    setStats({
      cache: cacheStats,
      timing: {
        ttfb: perfTiming ? perfTiming.responseStart - perfTiming.requestStart : 0,
        fcp,
        lcp: 0 // LCP would need proper measurement
      },
      memory: {
        used: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
        total: memoryInfo ? Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) : 0
      }
    });
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    performanceCache.clear();
    optimizedCache.clear();
    updateStats();
  };

  const cacheHitRate = stats.cache.hits + stats.cache.misses > 0 
    ? Math.round((stats.cache.hits / (stats.cache.hits + stats.cache.misses)) * 100)
    : 0;

  return (
    <Card className={`glass bg-white/90 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Performance Monitor</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={updateStats}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Performance */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-sm">Cache Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
              <p className="text-xs text-gray-600">Hit Rate</p>
              <p className="text-lg font-bold text-green-700">{cacheHitRate}%</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600">Cache Size</p>
              <p className="text-lg font-bold text-blue-700">{stats.cache.size}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Hits:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {stats.cache.hits}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Misses:</span>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {stats.cache.misses}
              </Badge>
            </div>
          </div>
        </div>

        {/* Performance Timing */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-sm">Load Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-100">
              <p className="text-xs text-gray-600">TTFB</p>
              <p className="text-lg font-bold text-yellow-700">{Math.round(stats.timing.ttfb)}ms</p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
              <p className="text-xs text-gray-600">FCP</p>
              <p className="text-lg font-bold text-purple-700">{Math.round(stats.timing.fcp)}ms</p>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        {stats.memory.total > 0 && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-red-600" />
              <span className="font-medium text-sm">Memory Usage</span>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-lg border border-red-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">JS Heap</span>
                <span className="text-sm font-bold text-red-700">
                  {stats.memory.used}MB / {stats.memory.total}MB
                </span>
              </div>
              <div className="mt-2 w-full bg-red-100 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.memory.used / stats.memory.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCache}
            className="w-full text-xs"
          >
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};