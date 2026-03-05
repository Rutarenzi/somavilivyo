
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { FloatingCard } from "@/components/ui/floating-card";
import { ArrowLeft, ArrowRight, RotateCcw, BookOpen, Target, Trophy } from "lucide-react";

interface LearningFooterProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onRestart?: () => void;
  isPreviousDisabled?: boolean;
  isNextDisabled?: boolean;
  nextButtonText?: string;
}

export function LearningFooter({
  onPrevious,
  onNext,
  onRestart,
  isPreviousDisabled = false,
  isNextDisabled = false,
  nextButtonText = "Next Module"
}: LearningFooterProps) {
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 sticky bottom-0 z-40">
      <div className="max-w-5xl mx-auto p-3 xs:p-4 md:p-6">
        <FloatingCard variant="glass" className="overflow-hidden">
          <div className="p-3 xs:p-4">
            <div className="flex items-center justify-between gap-2 xs:gap-4">
              {/* Previous Button */}
              <EnhancedButton
                variant="outline"
                onClick={onPrevious}
                disabled={isPreviousDisabled || !onPrevious}
                className="flex items-center gap-1 xs:gap-3 px-3 xs:px-6 py-2 xs:py-3 border-2 hover:scale-105 transition-all duration-200 disabled:hover:scale-100 text-xs xs:text-sm"
              >
                <ArrowLeft className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
                <span className="hidden xs:inline font-medium">Previous Module</span>
                <span className="xs:hidden">Prev</span>
              </EnhancedButton>

              {/* Center Actions */}
              <div className="flex items-center gap-2 xs:gap-4 flex-1 justify-center">
                {/* Learning Encouragement - Hidden on very small screens */}
                <div className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm text-gray-600">
                  <div className="flex items-center gap-1 xs:gap-2">
                    <BookOpen className="h-3 w-3 xs:h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span>Keep Learning</span>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-2">
                    <Target className="h-3 w-3 xs:h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Stay Focused</span>
                  </div>
                  <div className="flex items-center gap-1 xs:gap-2">
                    <Trophy className="h-3 w-3 xs:h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span>Achieve Goals</span>
                  </div>
                </div>

                {/* Restart Button */}
                {onRestart && (
                  <EnhancedButton
                    variant="ghost"
                    onClick={onRestart}
                    className="flex items-center gap-1 xs:gap-2 hover:scale-105 transition-transform px-2 xs:px-3 py-1.5 xs:py-2"
                  >
                    <RotateCcw className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline text-xs xs:text-sm">Restart</span>
                  </EnhancedButton>
                )}
              </div>

              {/* Next Button */}
              <EnhancedButton
                onClick={onNext}
                disabled={isNextDisabled || !onNext}
                variant="gradient"
                className="flex items-center gap-1 xs:gap-3 px-3 xs:px-6 py-2 xs:py-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:hover:scale-100 text-xs xs:text-sm"
              >
                <span className="font-medium truncate">{nextButtonText}</span>
                <ArrowRight className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
              </EnhancedButton>
            </div>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
