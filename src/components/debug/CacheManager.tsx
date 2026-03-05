
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cacheManager } from '@/utils/cache';
import { Trash2, RefreshCw, Database } from 'lucide-react';

export function CacheManagerDebug() {
  const [stats, setStats] = useState(cacheManager.getStats());

  const refreshStats = () => {
    setStats(cacheManager.getStats());
  };

  const clearAllCache = () => {
    cacheManager.clear();
    refreshStats();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Cache Manager</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.cacheSize}</div>
            <div className="text-sm text-gray-600">Cache Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.memoryCacheSize}</div>
            <div className="text-sm text-gray-600">Memory Items</div>
          </div>
        </div>
        
        <div className="text-center">
          <Badge variant="outline" className="text-sm">
            {stats.totalMemoryUsage}
          </Badge>
          <div className="text-xs text-gray-500 mt-1">Estimated Memory Usage</div>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={refreshStats}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={clearAllCache}
            variant="destructive"
            size="sm"
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
