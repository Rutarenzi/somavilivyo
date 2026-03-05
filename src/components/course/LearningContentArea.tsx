
import { useState } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { FloatingCard } from "@/components/ui/floating-card";
import { ArrowRight, BookOpen, Target, Clock, Star } from "lucide-react";
import { EnhancedDynamicContentRenderer } from "./EnhancedDynamicContentRenderer";
import { GamifiedQuiz } from "./GamifiedQuiz";
import { DynamicContentDebugger } from "./DynamicContentDebugger";
import { ModuleAudioPlayer } from "./ModuleAudioPlayer";
import { getValidQuiz } from '@/utils/quizFallback';

interface Module {
  id: string;
  title: string;
  content: string;
  learning_objective?: string;
  confirmationQuestion?: any;
  generated_code?: string;
  style_preferences?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    fontSize?: string;
    animationStyle?: string;
    layoutStyle?: string;
  };
}

interface LearningContentAreaProps {
  module: Module;
  onQuizComplete: (score: number) => void;
  onNext?: () => void;
  isCompleted: boolean;
}

export function LearningContentArea({
  module,
  onQuizComplete,
  onNext,
  isCompleted
}: LearningContentAreaProps) {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showDebugger, setShowDebugger] = useState(!module.generated_code); // Show debugger if no generated code

  const effectiveQuiz = getValidQuiz(module.confirmationQuestion, module.title, module.learning_objective, module.id);

  const handleRegenerateContent = () => {
    // Force a page reload to fetch updated content
    window.location.reload();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-indigo-50 min-h-full">
      <div className="max-w-5xl mx-auto p-3 xs:p-6 md:p-8 space-y-6 xs:space-y-8">
        {!showQuiz ? (
          <div className="space-y-6 xs:space-y-8 animate-fade-in">
            {/* Module Header Card */}
            <FloatingCard variant="glass" className="overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 xs:p-6 md:p-8 text-white">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col xs:flex-row xs:items-center gap-3 xs:gap-4 mb-4">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-5 w-5 xs:h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h1 className="text-xl xs:text-2xl md:text-3xl font-bold leading-tight line-clamp-2">{module.title}</h1>
                        {module.learning_objective && (
                          <div className="flex items-start gap-2 mt-2 text-white/90">
                            <Target className="h-3 w-3 xs:h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="text-xs xs:text-sm font-medium line-clamp-2">{module.learning_objective}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row lg:flex-col lg:items-end gap-2 lg:gap-2 flex-shrink-0">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 xs:px-3 py-1 xs:py-1.5 flex items-center gap-1 xs:gap-2">
                      <Clock className="h-3 w-3 xs:h-4 w-4 flex-shrink-0" />
                      <span className="text-xs xs:text-sm font-medium">15-20 min</span>
                    </div>
                    {isCompleted && (
                      <div className="bg-green-500/20 backdrop-blur-sm rounded-lg px-2 xs:px-3 py-1 xs:py-1.5 flex items-center gap-1 xs:gap-2">
                        <Star className="h-3 w-3 xs:h-4 w-4 text-green-300 flex-shrink-0" />
                        <span className="text-xs xs:text-sm font-medium text-green-300">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FloatingCard>

            {/* Content Section */}
            <EnhancedDynamicContentRenderer
              content={module.content}
              title={module.title}
              learningObjective={module.learning_objective}
              stylePreferences={module.style_preferences}
              generatedCode={module.generated_code}
              onRegenerateCode={() => setShowDebugger(true)}
            />

            {/* Audio Player - Always visible after Real-World Application */}
            <div className="mt-6">
              <ModuleAudioPlayer 
                content={module.content}
                title={module.title}
              />
            </div>

            {/* Debug Panel */}
            {showDebugger && (
              <DynamicContentDebugger
                module={module}
                courseId={new URLSearchParams(window.location.search).get('courseId') || ''}
                onRegenerate={handleRegenerateContent}
              />
            )}

            {/* Quiz Call-to-Action */}
            {effectiveQuiz && (
              <FloatingCard variant="gradient" className="text-center p-4 xs:p-6 md:p-8">
                <div className="space-y-4 xs:space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xl xs:text-2xl font-bold text-white">Ready to Test Your Knowledge?</h3>
                    <p className="text-white/90 text-sm xs:text-base md:text-lg px-2">
                      Complete the knowledge check to solidify your understanding and unlock the next module.
                    </p>
                  </div>
                  
                  <div className="flex flex-col xs:flex-row items-center justify-center gap-2 xs:gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 xs:px-4 xs:py-2 text-white/90 text-xs xs:text-sm">
                      🎯 Quick Assessment
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 xs:px-4 xs:py-2 text-white/90 text-xs xs:text-sm">
                      📈 Track Progress
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 xs:px-4 xs:py-2 text-white/90 text-xs xs:text-sm">
                      🏆 Earn Achievement
                    </div>
                  </div>

                  <EnhancedButton
                    onClick={() => setShowQuiz(true)}
                    variant="glass"
                    size="xl"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-xl hover:shadow-2xl text-sm xs:text-base px-6 xs:px-8 py-3 xs:py-4"
                  >
                    Start Knowledge Check
                    <ArrowRight className="h-4 w-4 xs:h-5 w-5 ml-2 flex-shrink-0" />
                  </EnhancedButton>
                </div>
              </FloatingCard>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            {effectiveQuiz && (
              <GamifiedQuiz
                quiz={effectiveQuiz}
                onComplete={onQuizComplete}
                onNext={isCompleted ? onNext : undefined}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
