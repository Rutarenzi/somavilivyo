import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileProgressTrackerProps {
  progressStats: {
    progressPercentage: number;
    completedModules: number;
    totalModules: number;
    averageScore?: number;
  };
  courseTitle: string;
  currentModule?: {
    title: string;
    estimatedMinutes: number;
  };
  className?: string;
}

export function MobileProgressTracker({
  progressStats,
  courseTitle,
  currentModule,
  className
}: MobileProgressTrackerProps) {
  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg p-3 xs:p-4 shadow-sm",
      "sticky top-0 z-40 backdrop-blur-sm bg-white/95",
      className
    )}>
      {/* Course Title & Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm xs:text-base text-gray-900 truncate flex-1 mr-2">
            {courseTitle}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {progressStats.progressPercentage}%
          </Badge>
        </div>
        
        <Progress 
          value={progressStats.progressPercentage} 
          className="h-2 xs:h-2.5" 
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 xs:gap-3 mt-3">
        {/* Completed Modules */}
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="h-3 w-3 xs:h-4 xs:w-4 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs xs:text-sm font-medium text-gray-900">
              {progressStats.completedModules}/{progressStats.totalModules}
            </div>
            <div className="text-xs text-gray-500 truncate">
              Modules
            </div>
          </div>
        </div>

        {/* Average Score */}
        {progressStats.averageScore !== undefined && (
          <div className="flex items-center space-x-1.5">
            <Trophy className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs xs:text-sm font-medium text-gray-900">
                {progressStats.averageScore}%
              </div>
              <div className="text-xs text-gray-500 truncate">
                Avg Score
              </div>
            </div>
          </div>
        )}

        {/* Current Module */}
        {currentModule && (
          <div className="flex items-center space-x-1.5 col-span-2 xs:col-span-1">
            <Target className="h-3 w-3 xs:h-4 xs:w-4 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs xs:text-sm font-medium text-gray-900 truncate">
                {currentModule.title}
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="h-2 w-2 flex-shrink-0" />
                <span>{currentModule.estimatedMinutes}m</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}