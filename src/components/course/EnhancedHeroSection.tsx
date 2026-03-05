
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Star, 
  Play, 
  Target,
  Award,
  Zap,
  TrendingUp
} from "lucide-react";

interface HeroSectionProps {
  course: {
    title: string;
    description: string;
    difficulty_level: string;
    skill_area?: string;
  };
  progressStats: {
    progressPercentage: number;
    completedModules: number;
    totalModules: number;
    currentModuleNumber: number;
  };
  onResumeLearning: () => void;
  estimatedTimeRemaining?: string;
  averageQuizScore?: number;
  badgesEarned?: number;
}

export function EnhancedHeroSection({
  course,
  progressStats,
  onResumeLearning,
  estimatedTimeRemaining = "2h 45m",
  averageQuizScore = 85,
  badgesEarned = 3
}: HeroSectionProps) {
  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
        <div className="absolute bottom-10 right-20 w-48 h-48 bg-purple-300/20 rounded-full blur-2xl animate-float" style={{animationDelay: "2s"}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div className="relative z-10 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Course Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Badge className={`${getDifficultyColor(course.difficulty_level)} border-0 px-4 py-2 text-sm font-semibold`}>
                <Star className="h-4 w-4 mr-2" />
                {course.difficulty_level}
              </Badge>
              {course.skill_area && (
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  <Target className="h-4 w-4 mr-2" />
                  {course.skill_area}
                </Badge>
              )}
              <Badge className="bg-yellow-500 text-white border-0 px-4 py-2 font-bold">
                <Zap className="h-4 w-4 mr-2" />
                EduPerfect
              </Badge>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 font-jakarta leading-tight">
              {course.title}
            </h1>
            
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* Global Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-lg font-semibold">Overall Progress</span>
              <span className="text-2xl font-bold">
                <AnimatedCounter value={progressStats.progressPercentage} />%
              </span>
            </div>
            <div className="relative">
              <Progress value={progressStats.progressPercentage} className="h-4 bg-white/20" />
              <div 
                className="absolute top-0 left-0 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressStats.progressPercentage}%` }}
              />
            </div>
            <div className="text-center mt-2 text-white/80">
              <AnimatedCounter value={progressStats.completedModules} /> of {progressStats.totalModules} modules completed
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-green-300" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  <AnimatedCounter value={progressStats.completedModules} />/{progressStats.totalModules}
                </div>
                <div className="text-sm text-white/80">Modules Done</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-blue-300" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  <AnimatedCounter value={averageQuizScore} />%
                </div>
                <div className="text-sm text-white/80">Avg Quiz Score</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-orange-300" />
                </div>
                <div className="text-2xl font-bold mb-1">{estimatedTimeRemaining}</div>
                <div className="text-sm text-white/80">Time Left</div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="h-6 w-6 text-yellow-300" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  <AnimatedCounter value={badgesEarned} />
                </div>
                <div className="text-sm text-white/80">Badges Earned</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4">
            <Button 
              onClick={onResumeLearning}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 font-bold px-8 py-4 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              <Play className="h-6 w-6 mr-3" />
              {progressStats.completedModules > 0 ? 'Resume Learning' : 'Start Learning'}
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg backdrop-blur-sm"
            >
              <Trophy className="h-6 w-6 mr-3" />
              View Achievements
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
