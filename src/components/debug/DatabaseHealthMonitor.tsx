import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Database, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DatabaseHealth {
  connectionStatus: 'healthy' | 'warning' | 'error';
  responseTime: number;
  corrupted_courses: number;
  orphaned_progress: number;
  missing_indexes: string[];
  rls_violations: string[];
  last_checked: Date;
}

export const DatabaseHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<DatabaseHealth>({
    connectionStatus: 'healthy',
    responseTime: 0,
    corrupted_courses: 0,
    orphaned_progress: 0,
    missing_indexes: [],
    rls_violations: [],
    last_checked: new Date()
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runHealthCheck = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      console.log('[DatabaseHealthMonitor] Starting comprehensive health check');
      
      // Test basic connectivity
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const responseTime = Date.now() - startTime;
      
      if (connectionError) {
        throw new Error(`Database connection failed: ${connectionError.message}`);
      }

      // Check for corrupted JSON in courses
      const { data: corruptedCourses, error: corruptedError } = await supabase
        .rpc('clean_corrupted_json');

      if (corruptedError) {
        console.warn('[DatabaseHealthMonitor] Could not check for corrupted data:', corruptedError);
      }

      // Check for orphaned progress records
      const { data: orphanedRecords, error: orphanedError } = await supabase
        .rpc('cleanup_orphaned_records');

      if (orphanedError) {
        console.warn('[DatabaseHealthMonitor] Could not check for orphaned records:', orphanedError);
      }

      // Determine overall health status
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      
      if (responseTime > 5000) {
        status = 'error';
      } else if (responseTime > 2000 || (corruptedCourses && corruptedCourses > 0) || (orphanedRecords && orphanedRecords > 0)) {
        status = 'warning';
      }

      setHealth({
        connectionStatus: status,
        responseTime,
        corrupted_courses: corruptedCourses || 0,
        orphaned_progress: orphanedRecords || 0,
        missing_indexes: [], // Would require admin access to check
        rls_violations: [], // Would require admin access to check
        last_checked: new Date()
      });

      toast({
        title: "Health Check Complete",
        description: `Database status: ${status}. Response time: ${responseTime}ms`,
        variant: status === 'error' ? 'destructive' : 'default',
      });

    } catch (error) {
      console.error('[DatabaseHealthMonitor] Health check failed:', error);
      
      setHealth(prev => ({
        ...prev,
        connectionStatus: 'error',
        responseTime: Date.now() - startTime,
        last_checked: new Date()
      }));

      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 500) return 'text-green-600';
    if (time < 2000) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    runHealthCheck();
    
    // Run health check every 5 minutes
    const interval = setInterval(runHealthCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database Health Monitor
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={runHealthCheck}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-3 rounded-lg border ${getStatusColor(health.connectionStatus)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(health.connectionStatus)}
                <span className="font-medium capitalize">{health.connectionStatus}</span>
              </div>
              <Badge variant="outline" className={getResponseTimeColor(health.responseTime)}>
                {health.responseTime}ms
              </Badge>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Data Integrity</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Corrupted Courses:</span>
                  <Badge variant={health.corrupted_courses > 0 ? 'destructive' : 'secondary'}>
                    {health.corrupted_courses}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Orphaned Records:</span>
                  <Badge variant={health.orphaned_progress > 0 ? 'destructive' : 'secondary'}>
                    {health.orphaned_progress}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Performance</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Response Time:</span>
                  <span className={getResponseTimeColor(health.responseTime)}>
                    {health.responseTime}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Last Checked:</span>
                  <span className="text-muted-foreground">
                    {health.last_checked.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings & Recommendations */}
          {health.connectionStatus !== 'healthy' && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Recommendations</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {health.responseTime > 2000 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span>Slow database response detected. Consider optimizing queries.</span>
                  </div>
                )}
                {health.corrupted_courses > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span>Corrupted course data detected. Run data cleanup.</span>
                  </div>
                )}
                {health.orphaned_progress > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    <span>Orphaned progress records found. Consider cleanup.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};