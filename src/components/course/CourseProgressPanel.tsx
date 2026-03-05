
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Clock, 
  Target, 
  BookOpen, 
  Star,
  CheckCircle,
  Flame,
  Calendar,
  Award,
  TrendingUp
} from "lucide-react";

interface Course {
  title: string;
  topics: any[];
}

interface Topic {
  title: string;
  subtopics: any[];
}

interface Subtopic {
  title: string;
  objectives: string[];
}

interface CourseProgressPanelProps {
  course: Course;
  currentTopic?: Topic;
  currentSubtopic?: Subtopic;
  progress: number;
  timeSpent: number;
  topicIndex: number;
  subtopicIndex: number;
}

export function CourseProgressPanel({
  course,
  currentTopic,
  currentSubtopic,
  progress,
  timeSpent,
  topicIndex,
  subtopicIndex
}: CourseProgressPanelProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const totalLessons = course.topics?.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0) || 0;
  const completedLessons = Math.floor((progress / 100) * totalLessons);
  const estimatedTimeRemaining = Math.max(0, (totalLessons - completedLessons) * 15); // 15 min per lesson

  const getMotivationalMessage = () => {
    if (progress === 0) return "Ready to start your learning journey!";
    if (progress < 25) return "Great start! Keep building momentum.";
    if (progress < 50) return "You're making excellent progress!";
    if (progress < 75) return "More than halfway there! Keep it up!";
    if (progress < 100) return "Almost finished! You're so close!";
    return "Congratulations! Course completed!";
  };

  const getProgressLevel = () => {
    if (progress < 25) return { level: "Beginner", color: "bg-blue-500", icon: BookOpen };
    if (progress < 50) return { level: "Learning", color: "bg-green-500", icon: TrendingUp };
    if (progress < 75) return { level: "Advanced", color: "bg-yellow-500", icon: Star };
    if (progress < 100) return { level: "Expert", color: "bg-purple-500", icon: Award };
    return { level: "Master", color: "bg-gradient-to-r from-yellow-400 to-orange-500", icon: Trophy };
  };

  const progressLevel = getProgressLevel();

  return (
    <div className="h-screen overflow-y-auto space-y-3 xs:space-y-6 p-3 xs:p-6">
      {/* Current Lesson Info */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3 xs:pb-4">
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
            <BookOpen className="h-4 w-4 xs:h-5 w-5 text-blue-600" />
            Current Lesson
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 xs:space-y-4">
          {currentSubtopic ? (
            <>
              <div>
                <Badge className="bg-blue-600 text-white mb-2 text-xs xs:text-sm px-2 xs:px-3 py-1">
                  Module {topicIndex + 1} • Lesson {subtopicIndex + 1}
                </Badge>
                <h3 className="font-bold text-gray-900 text-base xs:text-lg leading-tight">
                  {currentSubtopic.title}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-600">
                  <Target className="h-3 w-3 xs:h-4 w-4" />
                  <span>{currentSubtopic.objectives?.length || 0} learning objectives</span>
                </div>
                <div className="flex items-center gap-2 text-xs xs:text-sm text-gray-600">
                  <Clock className="h-3 w-3 xs:h-4 w-4" />
                  <span>15-20 minutes estimated</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-3 xs:py-4">
              <p className="text-gray-600 text-sm xs:text-base">Select a lesson to begin</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 xs:pb-4">
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
            <Trophy className="h-4 w-4 xs:h-5 w-5 text-yellow-600" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 xs:space-y-6">
          {/* Progress Level */}
          <div className="text-center">
            <div className={`w-16 h-16 xs:w-20 xs:h-20 ${progressLevel.color} rounded-full flex items-center justify-center mx-auto mb-2 xs:mb-3 shadow-lg`}>
              <progressLevel.icon className="h-8 w-8 xs:h-10 w-10 text-white" />
            </div>
            <div className="space-y-1">
              <div className="text-xl xs:text-2xl font-bold text-gray-900">{progress}%</div>
              <Badge className={`${progressLevel.color} text-white text-xs xs:text-sm`}>
                {progressLevel.level}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs xs:text-sm">
              <span className="text-gray-600">Course Completion</span>
              <span className="font-medium">{completedLessons}/{totalLessons}</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2 xs:h-3 bg-gray-200" />
              <div 
                className="absolute top-0 left-0 h-2 xs:h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 xs:p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-3 w-3 xs:h-4 w-4 text-orange-500" />
              <span className="text-xs xs:text-sm font-medium text-gray-700">Motivation</span>
            </div>
            <p className="text-xs xs:text-sm text-gray-800 font-medium">
              {getMotivationalMessage()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Learning Stats */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 xs:pb-4">
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
            <TrendingUp className="h-4 w-4 xs:h-5 w-5 text-green-600" />
            Learning Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 xs:space-y-4">
          <div className="grid grid-cols-1 gap-3 xs:gap-4">
            <div className="bg-blue-50 p-3 xs:p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 xs:gap-3">
                <Clock className="h-4 w-4 xs:h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-bold text-blue-900 text-sm xs:text-base">{formatTime(timeSpent)}</div>
                  <div className="text-xs xs:text-sm text-blue-700">Time Studied</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 xs:p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 xs:gap-3">
                <CheckCircle className="h-4 w-4 xs:h-5 w-5 text-green-600" />
                <div>
                  <div className="font-bold text-green-900 text-sm xs:text-base">{completedLessons}</div>
                  <div className="text-xs xs:text-sm text-green-700">Lessons Completed</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-3 xs:p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 xs:gap-3">
                <Calendar className="h-4 w-4 xs:h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-bold text-purple-900 text-sm xs:text-base">{Math.ceil(estimatedTimeRemaining / 60)}h</div>
                  <div className="text-xs xs:text-sm text-purple-700">Est. Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 xs:pb-4">
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
            <Award className="h-4 w-4 xs:h-5 w-5 text-yellow-600" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 xs:gap-3">
            <div className={`p-2 xs:p-3 rounded-lg text-center ${progress > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} border`}>
              <Star className={`h-4 w-4 xs:h-6 w-6 mx-auto mb-1 ${progress > 0 ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="text-xs font-medium">First Step</div>
            </div>
            
            <div className={`p-2 xs:p-3 rounded-lg text-center ${progress >= 25 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border`}>
              <TrendingUp className={`h-4 w-4 xs:h-6 w-6 mx-auto mb-1 ${progress >= 25 ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-xs font-medium">Quarter Way</div>
            </div>
            
            <div className={`p-2 xs:p-3 rounded-lg text-center ${progress >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'} border`}>
              <Award className={`h-4 w-4 xs:h-6 w-6 mx-auto mb-1 ${progress >= 50 ? 'text-yellow-600' : 'text-gray-400'}`} />
              <div className="text-xs font-medium">Halfway</div>
            </div>
            
            <div className={`p-2 xs:p-3 rounded-lg text-center ${progress >= 100 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'} border`}>
              <Trophy className={`h-4 w-4 xs:h-6 w-6 mx-auto mb-1 ${progress >= 100 ? 'text-purple-600' : 'text-gray-400'}`} />
              <div className="text-xs font-medium">Complete</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-3 xs:p-4 space-y-2 xs:space-y-3">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm xs:text-base py-2 xs:py-3">
            <BookOpen className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
            Download Resources
          </Button>
          <Button variant="outline" className="w-full text-sm xs:text-base py-2 xs:py-3">
            <Trophy className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
            View Certificate
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
