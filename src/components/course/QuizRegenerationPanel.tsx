
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useQuizRegeneration } from "@/hooks/useQuizRegeneration";
import { getCoursesNeedingQuizRegeneration } from "@/utils/quizQualityUtils";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw, CheckCircle, AlertTriangle, Zap, BookOpen } from "lucide-react";

interface CourseNeedingFix {
  id: string;
  title: string;
  description: string;
  totalModules: number;
  genericQuestions: number;
  qualityQuestions: number;
}

interface QuizRegenerationPanelProps {
  courseId?: string;
  onComplete?: () => void;
}

export function QuizRegenerationPanel({ courseId, onComplete }: QuizRegenerationPanelProps) {
  const { user } = useAuth();
  const { progress, isRunning, regenerateQuizForCourse, resetProgress } = useQuizRegeneration();
  const [coursesNeedingFix, setCoursesNeedingFix] = useState<CourseNeedingFix[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCoursesNeedingFix = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const courses = await getCoursesNeedingQuizRegeneration(user.id);
      setCoursesNeedingFix(courses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!courseId) {
      loadCoursesNeedingFix();
    }
  }, [user, courseId]);

  const handleRegeneration = async (targetCourseId: string) => {
    await regenerateQuizForCourse(targetCourseId);
    
    if (onComplete) {
      onComplete();
    }
    
    // Refresh the list after completion
    if (!courseId) {
      loadCoursesNeedingFix();
    }
  };

  // If courseId is provided, show single course regeneration
  if (courseId) {
    const courseNeedingFix = coursesNeedingFix.find(c => c.id === courseId);
    
    if (!courseNeedingFix && !loading) {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Quiz Quality Excellent!</h3>
            <p className="text-green-700">All quiz questions in this course are already high quality.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-900">
            <AlertTriangle className="h-5 w-5" />
            Quiz Quality Issues Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courseNeedingFix && (
            <div className="space-y-2">
              <p className="text-yellow-800">
                Found <strong>{courseNeedingFix.genericQuestions}</strong> generic quiz questions 
                out of <strong>{courseNeedingFix.totalModules}</strong> modules that need improvement.
              </p>
              <div className="flex gap-2">
                <Badge variant="destructive">{courseNeedingFix.genericQuestions} Generic</Badge>
                <Badge variant="secondary">{courseNeedingFix.qualityQuestions} Quality</Badge>
              </div>
            </div>
          )}

          {progress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Regeneration Progress</span>
                <span>{progress.processedModules}/{progress.totalModules}</span>
              </div>
              <Progress 
                value={(progress.processedModules / progress.totalModules) * 100} 
                className="h-2"
              />
              <p className="text-sm text-gray-600">
                Status: {progress.status} • Regenerated: {progress.regeneratedQuestions} questions
              </p>
            </div>
          )}

          <Button
            onClick={() => handleRegeneration(courseId)}
            disabled={isRunning || loading}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Regenerating Questions...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Fix Quiz Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show all courses needing fixes
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Quiz Quality Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                Courses with quiz quality issues: <strong>{coursesNeedingFix.length}</strong>
              </p>
              <Button
                onClick={loadCoursesNeedingFix}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {coursesNeedingFix.length === 0 && !loading && (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">All Courses Look Great!</h3>
                <p className="text-green-700">No quiz quality issues found in your courses.</p>
              </div>
            )}

            {coursesNeedingFix.map((course) => (
              <Card key={course.id} className="border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{course.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {course.genericQuestions} Generic
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {course.qualityQuestions} Quality
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRegeneration(course.id)}
                      disabled={isRunning}
                      size="sm"
                    >
                      {isRunning && progress?.courseId === course.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fixing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Fix Quizzes
                        </>
                      )}
                    </Button>
                  </div>

                  {progress && progress.courseId === course.id && (
                    <div className="mt-4 space-y-2">
                      <Progress 
                        value={(progress.processedModules / progress.totalModules) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-600">
                        {progress.processedModules}/{progress.totalModules} modules • 
                        {progress.regeneratedQuestions} questions regenerated
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
