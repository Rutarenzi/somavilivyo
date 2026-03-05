import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Star,
  Clock,
  Target,
  Award,
  BarChart3,
  Share2,
  Download,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Brain,
  Sparkles
} from "lucide-react";
import { FloatingCard } from "@/components/ui/floating-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";

interface CourseCompletionData {
  course: {
    id: string;
    title: string;
    description: string;
    difficulty_level: string;
    skill_area: string;
  };
  performance: {
    completedModules: number;
    totalModules: number;
    averageScore: number;
    totalTimeSpent: number; // in seconds
    highestScore: number;
    lowestScore: number;
    moduleScores: Array<{
      moduleId: string;
      title: string;
      score: number;
      timeSpent: number;
    }>;
  };
  achievements: Array<{
    title: string;
    description: string;
    icon: string;
    earned: boolean;
  }>;
}

interface CourseCompletionScreenProps {
  data: CourseCompletionData;
  onBackToCourses: () => void;
  onShareCertificate?: () => void;
  onDownloadCertificate?: () => void;
}

export function CourseCompletionScreen({
  data,
  onBackToCourses,
  onShareCertificate,
  onDownloadCertificate
}: CourseCompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50" };
    if (score >= 80) return { level: "Very Good", color: "text-blue-600", bg: "bg-blue-50" };
    if (score >= 70) return { level: "Good", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { level: "Needs Improvement", color: "text-orange-600", bg: "bg-orange-50" };
  };

  const performanceLevel = getPerformanceLevel(data.performance.averageScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 xs:p-6">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-purple-400/20 to-pink-400/20 animate-pulse" />
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 xs:space-y-8">
        {/* Hero Section */}
        <FloatingCard variant="gradient" className="text-center p-6 xs:p-8 md:p-12">
          <div className="space-y-4 xs:space-y-6">
            <div className="w-20 h-20 xs:w-24 xs:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto">
              <Trophy className="h-10 w-10 xs:h-12 w-12 text-white" />
            </div>
            
            <div className="space-y-2 xs:space-y-3">
              <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold text-white">
                🎉 Congratulations!
              </h1>
              <p className="text-lg xs:text-xl text-white/90">
                You've successfully completed
              </p>
              <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-white">
                {data.course.title}
              </h2>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 xs:gap-4">
              <Badge className="bg-white/20 text-white border-white/30 text-xs xs:text-sm px-3 py-1">
                <Star className="h-3 w-3 xs:h-4 w-4 mr-1" />
                {data.course.difficulty_level}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs xs:text-sm px-3 py-1">
                <Brain className="h-3 w-3 xs:h-4 w-4 mr-1" />
                {data.course.skill_area}
              </Badge>
            </div>
          </div>
        </FloatingCard>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6">
          {/* Overall Performance */}
          <FloatingCard variant="glass" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg xs:text-xl">
                <BarChart3 className="h-5 w-5 xs:h-6 w-6 text-indigo-600" />
                Your Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 xs:space-y-6">
              {/* Overall Score */}
              <div className="text-center space-y-2 xs:space-y-3">
                <div className="text-3xl xs:text-4xl md:text-5xl font-bold text-indigo-600">
                  {data.performance.averageScore}%
                </div>
                <div className={`inline-flex items-center gap-2 px-3 xs:px-4 py-1 xs:py-2 rounded-full ${performanceLevel.bg}`}>
                  <Award className={`h-4 w-4 xs:h-5 w-5 ${performanceLevel.color}`} />
                  <span className={`font-semibold text-sm xs:text-base ${performanceLevel.color}`}>
                    {performanceLevel.level}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 xs:gap-4">
                <div className="text-center p-3 xs:p-4 bg-indigo-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 xs:h-6 w-6 text-indigo-600 mx-auto mb-1 xs:mb-2" />
                  <div className="text-lg xs:text-xl font-bold text-indigo-600">
                    {data.performance.completedModules}
                  </div>
                  <div className="text-xs xs:text-sm text-gray-600">Modules</div>
                </div>

                <div className="text-center p-3 xs:p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 xs:h-6 w-6 text-green-600 mx-auto mb-1 xs:mb-2" />
                  <div className="text-lg xs:text-xl font-bold text-green-600">
                    {data.performance.highestScore}%
                  </div>
                  <div className="text-xs xs:text-sm text-gray-600">Best Score</div>
                </div>

                <div className="text-center p-3 xs:p-4 bg-purple-50 rounded-lg">
                  <Clock className="h-5 w-5 xs:h-6 w-6 text-purple-600 mx-auto mb-1 xs:mb-2" />
                  <div className="text-lg xs:text-xl font-bold text-purple-600">
                    {formatTime(data.performance.totalTimeSpent)}
                  </div>
                  <div className="text-xs xs:text-sm text-gray-600">Time Spent</div>
                </div>

                <div className="text-center p-3 xs:p-4 bg-yellow-50 rounded-lg">
                  <Target className="h-5 w-5 xs:h-6 w-6 text-yellow-600 mx-auto mb-1 xs:mb-2" />
                  <div className="text-lg xs:text-xl font-bold text-yellow-600">100%</div>
                  <div className="text-xs xs:text-sm text-gray-600">Completion</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm xs:text-base">
                  <span className="font-medium">Course Progress</span>
                  <span className="text-gray-600">{data.performance.completedModules}/{data.performance.totalModules}</span>
                </div>
                <Progress value={100} className="h-2 xs:h-3" />
              </div>
            </CardContent>
          </FloatingCard>

          {/* Achievements */}
          <FloatingCard variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg xs:text-xl">
                <Award className="h-5 w-5 xs:h-6 w-6 text-yellow-600" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 xs:space-y-4">
              {data.achievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 xs:p-4 rounded-lg border-2 transition-all ${
                    achievement.earned
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  <div className={`text-xl xs:text-2xl ${achievement.earned ? "" : "grayscale"}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm xs:text-base text-gray-900 truncate">
                      {achievement.title}
                    </h4>
                    <p className="text-xs xs:text-sm text-gray-600 line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <CheckCircle className="h-4 w-4 xs:h-5 w-5 text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </CardContent>
          </FloatingCard>
        </div>

        {/* Detailed Module Performance */}
        <FloatingCard variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg xs:text-xl">
              <BookOpen className="h-5 w-5 xs:h-6 w-6 text-blue-600" />
              Module Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 xs:space-y-4">
              {data.performance.moduleScores.map((module, index) => (
                <div key={module.moduleId} className="flex items-center gap-3 xs:gap-4 p-3 xs:p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 xs:w-10 xs:h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm xs:text-base font-bold text-indigo-600">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm xs:text-base text-gray-900 truncate">
                      {module.title}
                    </h4>
                    <div className="flex items-center gap-2 xs:gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 xs:h-4 w-4 text-gray-500" />
                        <span className="text-xs xs:text-sm text-gray-600">
                          {formatTime(module.timeSpent)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-lg xs:text-xl font-bold ${
                      module.score >= 80 ? 'text-green-600' : 
                      module.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {module.score}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </FloatingCard>

        {/* Action Buttons */}
        <FloatingCard variant="glass">
          <CardContent className="p-4 xs:p-6">
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-3 xs:gap-4">
              <EnhancedButton
                onClick={onBackToCourses}
                variant="outline"
                size="lg"
                className="flex items-center gap-2 px-6 xs:px-8 py-3 xs:py-4"
              >
                <BookOpen className="h-4 w-4 xs:h-5 w-5" />
                Explore More Courses
              </EnhancedButton>

              {onShareCertificate && (
                <EnhancedButton
                  onClick={onShareCertificate}
                  variant="gradient"
                  size="lg"
                  className="flex items-center gap-2 px-6 xs:px-8 py-3 xs:py-4"
                >
                  <Share2 className="h-4 w-4 xs:h-5 w-5" />
                  Share Achievement
                </EnhancedButton>
              )}

              {onDownloadCertificate && (
                <EnhancedButton
                  onClick={onDownloadCertificate}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2 px-6 xs:px-8 py-3 xs:py-4"
                >
                  <Download className="h-4 w-4 xs:h-5 w-5" />
                  Download Certificate
                </EnhancedButton>
              )}

              <EnhancedButton
                onClick={() => navigate(`/courses/${data.course.id}/progress`)}
                variant="ghost"
                size="lg"
                className="flex items-center gap-2 px-6 xs:px-8 py-3 xs:py-4"
              >
                <BarChart3 className="h-4 w-4 xs:h-5 w-5" />
                View Detailed Analytics
              </EnhancedButton>
            </div>
          </CardContent>
        </FloatingCard>
      </div>
    </div>
  );
}