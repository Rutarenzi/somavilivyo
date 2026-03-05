
import { Badge } from "@/components/ui/badge";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedProgress } from "@/components/ui/enhanced-progress";
import { FloatingCard } from "@/components/ui/floating-card";
import { Clock, BookOpen, Target, Star, Trophy, Play, TrendingUp } from "lucide-react";

interface Course {
  title: string;
  description: string;
  difficulty_level: string;
  skill_area: string;
}

interface ProgressStats {
  completedModules: number;
  totalModules: number;
  progressPercentage: number;
}

interface CourseHeroSectionProps {
  course: Course;
  progressStats: ProgressStats;
  onResumeLearning: () => void;
  estimatedTimeRemaining: string;
  averageQuizScore: number;
  badgesEarned: number;
}

export function CourseHeroSection({
  course,
  progressStats,
  onResumeLearning,
  estimatedTimeRemaining,
  averageQuizScore,
  badgesEarned
}: CourseHeroSectionProps) {
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      
      {/* Content Container - Mobile First */}
      <div className="relative z-10 px-3 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-8 sm:py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section - Mobile Optimized */}
          <div className="text-center mb-6 xs:mb-8 sm:mb-12">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center gap-2 xs:gap-3 mb-3 xs:mb-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs xs:text-sm px-2 xs:px-3 py-1 backdrop-blur-sm mx-auto xs:mx-0">
                <Star className="h-3 w-3 xs:h-4 w-4 mr-1 flex-shrink-0" />
                progressive
              </Badge>
              <Badge className={`${getDifficultyColor(course.difficulty_level)} text-xs xs:text-sm px-2 xs:px-3 py-1 mx-auto xs:mx-0`}>
                <Target className="h-3 w-3 xs:h-4 w-4 mr-1 flex-shrink-0" />
                {course.skill_area}
              </Badge>
            </div>
            
            {/* Course Title - Responsive Text */}
            <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 xs:mb-4 sm:mb-6 leading-tight px-2">
              {course.title}
            </h1>
            
            {/* Course Description - Responsive Text */}
            <p className="text-sm xs:text-base sm:text-lg text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
              {course.description}
            </p>
          </div>

          {/* Stats and Progress Section - Mobile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 sm:gap-8 mb-6 xs:mb-8">
            {/* Progress Card - Mobile Optimized */}
            <FloatingCard variant="glass" className="bg-white/10 backdrop-blur-md border-white/20 p-4 xs:p-6">
              <div className="space-y-3 xs:space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base xs:text-lg font-semibold text-white">Overall Progress</h3>
                  <EnhancedButton
                    onClick={onResumeLearning}
                    variant="gradient"
                    size="sm"
                    className="text-xs xs:text-sm px-3 xs:px-4 py-1.5 xs:py-2"
                  >
                    <Play className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Continue Learning</span>
                    <span className="xs:hidden">Continue</span>
                  </EnhancedButton>
                </div>
                
                <div className="space-y-2 xs:space-y-3">
                  <div className="flex justify-between text-xs xs:text-sm text-white/80">
                    <span>{progressStats.completedModules} of {progressStats.totalModules} modules completed</span>
                    <span>{progressStats.progressPercentage}%</span>
                  </div>
                  <EnhancedProgress 
                    value={progressStats.progressPercentage} 
                    className="h-2 xs:h-3 bg-white/20" 
                  />
                </div>
              </div>
            </FloatingCard>

            {/* Achievement Stats - Mobile Grid */}
            <div className="grid grid-cols-2 gap-2 xs:gap-3 sm:gap-4">
              {/* Modules Progress */}
              <FloatingCard variant="glass" className="bg-white/10 backdrop-blur-md border-white/20 p-3 xs:p-4">
                <div className="text-center space-y-1 xs:space-y-2">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-4 w-4 xs:h-5 w-5 text-white" />
                  </div>
                  <div className="text-lg xs:text-2xl font-bold text-white">
                    {progressStats.completedModules}/{progressStats.totalModules}
                  </div>
                  <div className="text-xs xs:text-sm text-white/80">Modules Done</div>
                </div>
              </FloatingCard>

              {/* Time Remaining */}
              <FloatingCard variant="glass" className="bg-white/10 backdrop-blur-md border-white/20 p-3 xs:p-4">
                <div className="text-center space-y-1 xs:space-y-2">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-4 w-4 xs:h-5 w-5 text-white" />
                  </div>
                  <div className="text-lg xs:text-2xl font-bold text-white">{estimatedTimeRemaining}</div>
                  <div className="text-xs xs:text-sm text-white/80">Time Left</div>
                </div>
              </FloatingCard>

              {/* Quiz Score */}
              <FloatingCard variant="glass" className="bg-white/10 backdrop-blur-md border-white/20 p-3 xs:p-4">
                <div className="text-center space-y-1 xs:space-y-2">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <TrendingUp className="h-4 w-4 xs:h-5 w-5 text-white" />
                  </div>
                  <div className="text-lg xs:text-2xl font-bold text-white">{averageQuizScore}%</div>
                  <div className="text-xs xs:text-sm text-white/80">Avg Score</div>
                </div>
              </FloatingCard>

              {/* Badges Earned */}
              <FloatingCard variant="glass" className="bg-white/10 backdrop-blur-md border-white/20 p-3 xs:p-4">
                <div className="text-center space-y-1 xs:space-y-2">
                  <div className="w-8 h-8 xs:w-10 xs:h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="h-4 w-4 xs:h-5 w-5 text-white" />
                  </div>
                  <div className="text-lg xs:text-2xl font-bold text-white">{badgesEarned}</div>
                  <div className="text-xs xs:text-sm text-white/80">Badges</div>
                </div>
              </FloatingCard>
            </div>
          </div>

          {/* Action Button - Mobile Centered */}
          <div className="text-center">
            <EnhancedButton
              onClick={onResumeLearning}
              variant="default"
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-50 font-semibold px-6 xs:px-8 py-3 xs:py-4 text-sm xs:text-base shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Play className="h-4 w-4 xs:h-5 w-5 mr-2 xs:mr-3 flex-shrink-0" />
              <span>Continue Your Learning Journey</span>
            </EnhancedButton>
          </div>
        </div>
      </div>
    </div>
  );
}
