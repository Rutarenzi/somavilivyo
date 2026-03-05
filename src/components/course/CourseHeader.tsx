
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, BookOpen, Award, Menu, X, Trophy } from "lucide-react";

interface Course {
  id?: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  topics: any[];
  skill_area?: string;
}

interface CourseHeaderProps {
  course: Course;
  progress: number;
  timeSpent: number;
  onBackToCourse: () => void;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function CourseHeader({ 
  course, 
  progress, 
  timeSpent, 
  onBackToCourse, 
  onToggleSidebar, 
  sidebarCollapsed 
}: CourseHeaderProps) {
  const totalLessons = course.topics?.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0) || 0;
  const completedLessons = Math.floor((progress / 100) * totalLessons);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-green-500 text-white';
      case 'intermediate': return 'bg-yellow-500 text-white';
      case 'advanced': return 'bg-red-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-50">
      <div className="px-3 xs:px-6 py-3 xs:py-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-3 xs:mb-4 gap-3 xs:gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-2 xs:gap-4 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleSidebar}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-1 xs:p-2"
            >
              {sidebarCollapsed ? <Menu className="h-3 w-3 xs:h-4 w-4" /> : <X className="h-3 w-3 xs:h-4 w-4" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBackToCourse}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 hidden xs:flex"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Course Overview
            </Button>
            
            <div className="h-4 xs:h-6 w-px bg-gray-300 hidden xs:block" />
            
            <div className="flex items-center gap-2 xs:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-4 w-4 xs:h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base xs:text-xl font-bold text-gray-900 truncate">
                  {course.title}
                </h1>
                <div className="flex items-center gap-1 xs:gap-2 mt-1">
                  <Badge className={`${getDifficultyColor(course.difficulty_level)} text-xs px-1 xs:px-2 py-0.5`}>
                    <Award className="h-2 w-2 xs:h-3 w-3 mr-0.5 xs:mr-1" />
                    {course.difficulty_level}
                  </Badge>
                  {course.skill_area && (
                    <Badge variant="secondary" className="text-xs hidden xs:inline-flex">
                      {course.skill_area}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Hidden on small screens, shown as overlay or separate section */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            <div className="flex items-center gap-3 lg:gap-6 text-xs lg:text-sm">
              <div className="flex items-center gap-1 xs:gap-2 bg-gray-50 px-2 xs:px-3 py-1 xs:py-2 rounded-lg">
                <BookOpen className="h-3 w-3 xs:h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-700">
                  {completedLessons}/{totalLessons}
                </span>
                <span className="text-gray-500 hidden lg:inline">lessons</span>
              </div>
              
              <div className="flex items-center gap-1 xs:gap-2 bg-gray-50 px-2 xs:px-3 py-1 xs:py-2 rounded-lg">
                <Clock className="h-3 w-3 xs:h-4 w-4 text-green-600" />
                <span className="font-medium text-gray-700">{formatTime(timeSpent)}</span>
                <span className="text-gray-500 hidden lg:inline">studied</span>
              </div>
              
              <div className="flex items-center gap-1 xs:gap-2 bg-gray-50 px-2 xs:px-3 py-1 xs:py-2 rounded-lg">
                <Trophy className="h-3 w-3 xs:h-4 w-4 text-yellow-600" />
                <span className="font-medium text-gray-700">{progress}%</span>
                <span className="text-gray-500 hidden lg:inline">complete</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1 xs:space-y-2">
          <div className="flex justify-between items-center text-xs xs:text-sm">
            <span className="font-medium text-gray-700">Learning Progress</span>
            <div className="flex items-center gap-1 xs:gap-2">
              <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 text-xs">On track</span>
            </div>
          </div>
          <div className="relative">
            <Progress 
              value={progress} 
              className="h-1.5 xs:h-2 bg-gray-100" 
            />
            <div 
              className="absolute top-0 left-0 h-1.5 xs:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Mobile Stats - Shown only on small screens */}
        <div className="md:hidden mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <BookOpen className="h-3 w-3" />
            <span>{completedLessons}/{totalLessons}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-3 w-3" />
            <span>{formatTime(timeSpent)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Trophy className="h-3 w-3" />
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
