
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  inProgress: boolean;
  estimatedTime?: number;
}

interface LiveProgressTrackerProps {
  isGenerating: boolean;
  currentPhase: string;
  overallProgress: number;
  phaseProgress: number;
  steps: ProgressStep[];
}

export function LiveProgressTracker({
  isGenerating,
  currentPhase,
  overallProgress,
  phaseProgress,
  steps
}: LiveProgressTrackerProps) {
  // Don't show anything if not generating
  if (!isGenerating) return null;
  
  return (
    <Card className="border border-blue-200 bg-blue-50/40">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="font-medium text-blue-700">Generating: {currentPhase}</span>
          </div>
          <span className="text-xs text-blue-600">{Math.round(phaseProgress)}%</span>
        </div>
        
        <Progress value={phaseProgress} className="h-2 mb-3" />
        
        {steps.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {steps.map(step => (
              <div key={step.id} className="flex items-start gap-2">
                <div className="mt-0.5">
                  {step.completed ? (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  ) : step.inProgress ? (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{step.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
