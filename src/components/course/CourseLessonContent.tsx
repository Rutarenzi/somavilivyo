
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, ArrowRight, Target, BookOpen, Trophy } from "lucide-react";

interface Subtopic {
  title: string;
  description: string;
  objectives: string[];
  exercises: string[];
}

interface Topic {
  title: string;
  description: string;
  subtopics: Subtopic[];
}

interface CourseLessonContentProps {
  topic?: Topic;
  subtopic?: Subtopic;
  topicIndex: number;
  subtopicIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onMarkComplete: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function CourseLessonContent({
  topic,
  subtopic,
  topicIndex,
  subtopicIndex,
  onNext,
  onPrevious,
  onMarkComplete,
  canGoNext,
  canGoPrevious
}: CourseLessonContentProps) {
  if (!topic || !subtopic) {
    return (
      <div className="flex items-center justify-center h-48 xs:h-64 p-3 xs:p-6">
        <div className="text-center">
          <BookOpen className="h-8 w-8 xs:h-12 w-12 text-gray-400 mx-auto mb-3 xs:mb-4" />
          <h3 className="text-base xs:text-lg font-medium text-gray-900 mb-2">No Content Available</h3>
          <p className="text-sm xs:text-base text-gray-600 max-w-md">Select a lesson from the navigation sidebar to begin learning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 xs:space-y-6 p-3 xs:p-6">
      {/* Lesson Header */}
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-indigo-100 text-indigo-700 text-xs xs:text-sm px-2 xs:px-3 py-1">
              Topic {topicIndex + 1} • Lesson {subtopicIndex + 1}
            </Badge>
          </div>
          <CardTitle className="text-lg xs:text-xl md:text-2xl text-gray-900 leading-tight">{subtopic.title}</CardTitle>
          <p className="text-gray-600 text-sm xs:text-base md:text-lg leading-relaxed">{subtopic.description}</p>
        </CardHeader>
      </Card>

      {/* Learning Objectives */}
      {subtopic.objectives && subtopic.objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
              <Target className="h-4 w-4 xs:h-5 w-5 text-indigo-500" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 xs:space-y-3">
              {subtopic.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-2 xs:gap-3">
                  <CheckCircle className="h-4 w-4 xs:h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 leading-relaxed text-sm xs:text-base">{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Main Content Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
            <BookOpen className="h-4 w-4 xs:h-5 w-5 text-purple-500" />
            Lesson Content
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm xs:prose-lg max-w-none">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 xs:p-6 rounded-lg border">
            <h4 className="text-base xs:text-lg font-semibold text-gray-800 mb-2 xs:mb-3">
              Topic: {topic.title}
            </h4>
            <p className="text-gray-700 leading-relaxed mb-3 xs:mb-4 text-sm xs:text-base">
              {topic.description}
            </p>
            <div className="bg-white p-3 xs:p-4 rounded-md border border-blue-200">
              <h5 className="font-medium text-gray-800 mb-2 text-sm xs:text-base">Current Focus:</h5>
              <p className="text-gray-600 text-sm xs:text-base">{subtopic.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practical Exercises */}
      {subtopic.exercises && subtopic.exercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base xs:text-lg">
              <Trophy className="h-4 w-4 xs:h-5 w-5 text-yellow-500" />
              Practical Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 xs:gap-4">
              {subtopic.exercises.map((exercise, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 p-3 xs:p-4 rounded-lg">
                  <div className="flex items-start gap-2 xs:gap-3">
                    <div className="w-5 h-5 xs:w-6 xs:h-6 bg-yellow-400 text-white rounded-full flex items-center justify-center text-xs xs:text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed text-sm xs:text-base">{exercise}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Controls */}
      <Card>
        <CardContent className="pt-4 xs:pt-6">
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-3 xs:gap-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="flex items-center gap-1 xs:gap-2 justify-center text-sm xs:text-base py-2 xs:py-3"
            >
              <ArrowLeft className="h-3 w-3 xs:h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={onMarkComplete}
              className="bg-green-600 hover:bg-green-700 text-white text-sm xs:text-base py-2 xs:py-3"
            >
              <CheckCircle className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
              Mark Complete
            </Button>

            <Button
              onClick={onNext}
              disabled={!canGoNext}
              className="flex items-center gap-1 xs:gap-2 justify-center text-sm xs:text-base py-2 xs:py-3"
            >
              Next
              <ArrowRight className="h-3 w-3 xs:h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
