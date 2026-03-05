import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface AuditPhase {
  phase: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  description: string;
  completedAt?: Date;
  issues?: number;
}

interface AuditCompletionSummaryProps {
  phases: AuditPhase[];
  className?: string;
}

const auditPhases: AuditPhase[] = [
  {
    phase: 'Phase 1: Critical Fixes',
    status: 'completed',
    description: 'Fixed CodeSandboxRenderer, optimized StudentProgressDashboard, enhanced error boundaries',
    completedAt: new Date(),
    issues: 0
  },
  {
    phase: 'Phase 2: Performance Optimization',
    status: 'completed',
    description: 'Implemented API deduplication, query optimization, mobile optimizations',
    completedAt: new Date(),
    issues: 0
  },
  {
    phase: 'Phase 3: Database & Security',
    status: 'in-progress',
    description: 'Database indexing, RLS policies, data validation, security auditing',
    issues: 2
  },
  {
    phase: 'Phase 4: UI/UX Enhancement',
    status: 'pending',
    description: 'Mobile responsiveness fixes, user experience improvements'
  }
];

export const AuditCompletionSummary: React.FC<AuditCompletionSummaryProps> = ({ 
  phases = auditPhases, 
  className 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const totalPhases = phases.length;
  const progressPercentage = Math.round((completedPhases / totalPhases) * 100);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Audit Implementation Progress</CardTitle>
        <CardDescription>
          {completedPhases} of {totalPhases} phases completed ({progressPercentage}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Phase list */}
          <div className="space-y-3">
            {phases.map((phase, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="mt-0.5">
                  {getStatusIcon(phase.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{phase.phase}</h4>
                    <div className="flex items-center gap-2">
                      {phase.issues !== undefined && phase.issues > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {phase.issues} issues
                        </Badge>
                      )}
                      <Badge variant={getStatusColor(phase.status) as any}>
                        {phase.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                  {phase.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {phase.completedAt.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedPhases}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {phases.filter(p => p.status === 'in-progress').length}
              </p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground">
                {phases.filter(p => p.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {phases.reduce((acc, p) => acc + (p.issues || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Issues</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};