
import { Badge } from "@/components/ui/badge";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedProgress } from "@/components/ui/enhanced-progress";
import { FloatingCard } from "@/components/ui/floating-card";
import { ArrowLeft, Clock, Users, Trophy, Target, Menu } from "lucide-react";

interface LearningHeaderProps {
  currentModuleNumber: number;
  totalModules: number;
  moduleTitle: string;
  progressPercentage: number;
  onBack?: () => void;
  onToggleSidebar?: () => void;
}

export function LearningHeader({
  currentModuleNumber,
  totalModules,
  moduleTitle,
  progressPercentage,
  onBack,
  onToggleSidebar
}: LearningHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="p-3 xs:p-4 md:p-6">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 gap-3 xs:gap-4">
          <div className="flex items-center gap-2 xs:gap-4 min-w-0 flex-1">
            {/* Mobile Sidebar Toggle */}
            {onToggleSidebar && (
              <EnhancedButton 
                variant="outline" 
                onClick={onToggleSidebar}
                className="lg:hidden flex items-center gap-1 xs:gap-2 hover:scale-105 transition-transform flex-shrink-0 px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm"
              >
                <Menu className="h-3 w-3 xs:h-4 w-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </EnhancedButton>
            )}
            
            {onBack && (
              <EnhancedButton 
                variant="outline" 
                onClick={onBack} 
                className="flex items-center gap-1 xs:gap-2 hover:scale-105 transition-transform flex-shrink-0 px-2 xs:px-3 py-1.5 xs:py-2 text-xs xs:text-sm"
              >
                <ArrowLeft className="h-3 w-3 xs:h-4 w-4" />
                <span className="hidden xs:inline">Back</span>
              </EnhancedButton>
            )}
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 min-w-0">
              <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 xs:px-4 py-1 xs:py-2 text-xs xs:text-sm font-medium flex-shrink-0">
                Module {currentModuleNumber} of {totalModules}
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-xs xs:text-sm text-green-700 font-medium">Learning Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-6">
            {/* Learning Stats */}
            <div className="flex items-center justify-between xs:justify-start gap-2 xs:gap-4 text-xs xs:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
                <span>15-20 min</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline">12.5k learners</span>
                <span className="xs:hidden">12.5k</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 xs:h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span className="hidden xs:inline">94% success</span>
                <span className="xs:hidden">94%</span>
              </div>
            </div>
            
            {/* Progress Circle */}
            <div className="relative flex-shrink-0 self-end xs:self-auto">
              <div className="w-12 h-12 xs:w-16 xs:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm xs:text-xl font-bold text-indigo-600">{progressPercentage}%</div>
                  <div className="text-xs text-gray-600 hidden xs:block">Complete</div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-2 xs:border-4 border-transparent bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Module Title and Progress */}
        <div className="space-y-3 xs:space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900 leading-tight line-clamp-2">{moduleTitle}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <Target className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
                <span className="text-xs xs:text-sm line-clamp-1">Master the concepts and apply them practically</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs xs:text-sm">
              <span className="text-gray-600">Course Progress</span>
              <span className="font-medium text-indigo-600">{currentModuleNumber}/{totalModules} modules</span>
            </div>
            <EnhancedProgress 
              value={progressPercentage} 
              className="h-2 xs:h-3 bg-gray-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
