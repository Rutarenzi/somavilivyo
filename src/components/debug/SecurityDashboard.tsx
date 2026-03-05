import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { useSecurityValidation } from '@/hooks/useSecurityValidation';

interface SecurityDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isVisible, onClose }) => {
  const [performanceReport, setPerformanceReport] = useState(PerformanceMonitor.getPerformanceReport());
  const { validationState } = useSecurityValidation();

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceReport(PerformanceMonitor.getPerformanceReport());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const getSecurityScore = () => {
    let score = 100;
    
    // Deduct points for performance issues
    if (performanceReport.averageRenderTime > 100) score -= 20;
    if (performanceReport.averageApiTime > 2000) score -= 15;
    if (performanceReport.memoryUsage > 100 * 1024 * 1024) score -= 15;
    if (performanceReport.errorCount > 10) score -= 25;
    
    // Deduct points for validation issues
    if (validationState.validationErrors.length > 0) score -= 15;
    
    return Math.max(0, score);
  };

  const securityScore = getSecurityScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-success" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <AlertTriangle className="h-5 w-5 text-danger" />;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle>Security & Performance Dashboard</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <CardDescription>
            Monitor application security, performance metrics, and system health
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Security Score</p>
                    <p className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
                      {securityScore}%
                    </p>
                  </div>
                  {getScoreIcon(securityScore)}
                </div>
                <Progress value={securityScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Error Count</p>
                    <p className="text-2xl font-bold">{performanceReport.errorCount}</p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Memory Usage</p>
                    <p className="text-2xl font-bold">
                      {(performanceReport.memoryUsage / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Average Render Time</span>
                      <Badge variant={performanceReport.averageRenderTime > 100 ? "destructive" : "secondary"}>
                        {performanceReport.averageRenderTime.toFixed(2)}ms
                      </Badge>
                    </div>
                    <Progress 
                      value={Math.min(100, (performanceReport.averageRenderTime / 200) * 100)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Average API Time</span>
                      <Badge variant={performanceReport.averageApiTime > 2000 ? "destructive" : "secondary"}>
                        {performanceReport.averageApiTime.toFixed(0)}ms
                      </Badge>
                    </div>
                    <Progress 
                      value={Math.min(100, (performanceReport.averageApiTime / 4000) * 100)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Validation Issues */}
          {validationState.validationErrors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Security Validation Issues
              </h3>
              <div className="space-y-2">
                {validationState.validationErrors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-destructive/10 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm">{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {performanceReport.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Performance Recommendations</h3>
              <div className="space-y-2">
                {performanceReport.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-md">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => PerformanceMonitor.clearMetrics()}
            >
              Clear Metrics
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPerformanceReport(PerformanceMonitor.getPerformanceReport())}
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};