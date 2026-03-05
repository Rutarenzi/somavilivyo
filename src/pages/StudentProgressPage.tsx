
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StudentProgressDashboard } from '@/components/feedback/StudentProgressDashboard';
import { LearningInsightsPanel } from '@/components/feedback/LearningInsightsPanel';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { ArrowLeft } from 'lucide-react';
import { useOptimizedCoursesEnhanced } from '@/hooks/useOptimizedCoursesEnhanced';

export default function StudentProgressPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses } = useOptimizedCoursesEnhanced();

  const course = courses.find(c => c.id === courseId);

  if (!courseId) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-3 xs:p-6">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-3 xs:mb-4">Course Not Found</h2>
          <EnhancedButton onClick={() => navigate('/courses')} variant="gradient" size="sm" className="xs:size-default">
            <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
            Back to Courses
          </EnhancedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto px-3 xs:px-4 py-3 xs:py-6">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 xs:mb-6 gap-3 xs:gap-4">
          <div className="flex flex-col xs:flex-row xs:items-center space-y-2 xs:space-y-0 xs:space-x-4">
            <EnhancedButton
              onClick={() => navigate(`/courses/${courseId}`)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 xs:space-x-2 self-start xs:self-auto"
            >
              <ArrowLeft className="h-3 w-3 xs:h-4 w-4" />
              <span className="text-xs xs:text-sm">Back to Course</span>
            </EnhancedButton>
            <div className="min-w-0">
              <h1 className="text-lg xs:text-xl md:text-2xl font-bold text-gray-900 truncate">Progress Dashboard</h1>
              {course && (
                <p className="text-sm xs:text-base text-gray-600 truncate">{course.title}</p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 xs:gap-4 md:gap-6">
          {/* Main Dashboard */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <StudentProgressDashboard courseId={courseId} />
          </div>
          
          {/* Insights Sidebar */}
          <div className="xl:col-span-1 order-1 xl:order-2">
            <LearningInsightsPanel courseId={courseId} />
          </div>
        </div>
      </div>
    </div>
  );
}
