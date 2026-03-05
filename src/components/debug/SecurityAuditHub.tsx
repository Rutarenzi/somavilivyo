import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { DataValidator, DataIntegrityIssue } from '@/utils/dataValidation';
import { useToast } from '@/hooks/use-toast';

interface SecurityAuditHubProps {
  className?: string;
}

export const SecurityAuditHub: React.FC<SecurityAuditHubProps> = ({ className }) => {
  const [integrityIssues, setIntegrityIssues] = useState<DataIntegrityIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  const runIntegrityCheck = async () => {
    setIsChecking(true);
    try {
      const issues = await DataValidator.checkDataIntegrity();
      setIntegrityIssues(issues);
      setLastCheck(new Date());
      
      const criticalIssues = issues.filter(issue => issue.severity === 'critical');
      const highIssues = issues.filter(issue => issue.severity === 'high');
      
      if (criticalIssues.length > 0) {
        toast({
          title: "Critical Data Issues Found",
          description: `${criticalIssues.length} critical issues detected`,
          variant: "destructive"
        });
      } else if (highIssues.length > 0) {
        toast({
          title: "Data Issues Found",
          description: `${highIssues.length} high priority issues detected`,
          variant: "default"
        });
      } else {
        toast({
          title: "Data Integrity Check Complete",
          description: "No critical issues found",
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Integrity Check Failed",
        description: "Unable to complete data integrity check",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    setIsCleaning(true);
    try {
      const result = await DataValidator.cleanupOrphanedRecords();
      
      if (result.errors.length > 0) {
        toast({
          title: "Cleanup Completed with Errors",
          description: `Cleaned ${result.cleaned} records but encountered ${result.errors.length} errors`,
          variant: "default"
        });
      } else {
        toast({
          title: "Cleanup Successful",
          description: `Successfully cleaned ${result.cleaned} orphaned records`,
          variant: "default"
        });
      }
      
      // Re-run integrity check after cleanup
      await runIntegrityCheck();
    } catch (error) {
      toast({
        title: "Cleanup Failed",
        description: "Unable to cleanup orphaned records",
        variant: "destructive"
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'default';
    }
  };

  useEffect(() => {
    // Run initial integrity check
    runIntegrityCheck();
  }, []);

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Hub
          </CardTitle>
          <CardDescription>
            Monitor data integrity and security across the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runIntegrityCheck} 
              disabled={isChecking}
              variant="outline"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Run Integrity Check
            </Button>
            
            <Button 
              onClick={cleanupOrphanedRecords} 
              disabled={isCleaning || integrityIssues.length === 0}
              variant="secondary"
            >
              {isCleaning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Cleanup Orphaned Data
            </Button>
          </div>

          {lastCheck && (
            <p className="text-sm text-muted-foreground">
              Last check: {lastCheck.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {integrityIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Integrity Issues</CardTitle>
            <CardDescription>
              Found {integrityIssues.length} data integrity issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrityIssues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <p className="font-medium">
                        {issue.table_name} - {issue.issue_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {issue.count} records affected
                      </p>
                    </div>
                  </div>
                  <Badge variant={getSeverityColor(issue.severity) as any}>
                    {issue.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {integrityIssues.length === 0 && lastCheck && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h3 className="text-lg font-medium">All Clear!</h3>
              <p className="text-muted-foreground">
                No data integrity issues detected
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};