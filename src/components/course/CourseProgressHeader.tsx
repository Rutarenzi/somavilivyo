
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, Clock, Award } from "lucide-react";

interface Course {
  id?: string;
  title: string;
  description: string;
  difficulty_level: string;
  estimated_duration: string;
  topics: any[];
}

interface CourseProgressHeaderProps {
  course: Course;
  progress: number;
  onBackToCourse: () => void;
}

export function CourseProgressHeader({ course, progress, onBackToCourse }: CourseProgressHeaderProps) {
  const totalLessons = course.topics?.reduce((acc, topic) => acc + (topic.subtopics?.length || 0), 0) || 0;
  const completedLessons = Math.floor((progress / 100) * totalLessons);

  return (
    <div className="bg-white border-b border-gray-200 p-3 xs:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-3 xs:mb-4 gap-3 xs:gap-4">
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 min-w-0 flex-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBackToCourse}
              className="text-gray-600 hover:text-gray-800 self-start xs:self-auto px-2 xs:px-3 py-1 xs:py-2 text-xs xs:text-sm"
            >
              <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
              Back to Overview
            </Button>
            <div className="h-4 xs:h-6 w-px bg-gray-300 hidden xs:block" />
            <h1 className="text-lg xs:text-xl font-bold text-gray-900 truncate">
              {course.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 xs:gap-6 text-xs xs:text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 xs:h-4 w-4" />
              <span>{completedLessons}/{totalLessons} lessons</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 xs:h-4 w-4" />
              <span>{course.estimated_duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="h-3 w-3 xs:h-4 w-4" />
              <span className="capitalize">{course.difficulty_level}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs xs:text-sm">
            <span className="font-medium text-gray-700">Course Progress</span>
            <span className="font-bold text-indigo-600">{progress}% Complete</span>
          </div>
          <Progress value={progress} className="h-2 xs:h-3" />
        </div>
      </div>
    </div>
  );
}
