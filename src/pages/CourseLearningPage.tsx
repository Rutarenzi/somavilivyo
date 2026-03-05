
import { useParams, useNavigate } from "react-router-dom";
import { OptimizedLearningInterface } from "@/components/course/OptimizedLearningInterface";
import { AnalyticsTrackingWrapper } from "@/components/course/AnalyticsTrackingWrapper";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { PageIntro } from "@/components/layout/PageIntro";
import { useContentRecovery } from '@/hooks/useContentRecovery';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from "lucide-react";
import { performanceMonitor } from "@/utils/performance";
import { useEffect } from "react";

export default function CourseLearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { checkAndRecoverContent } = useContentRecovery();
  
  // Start performance monitoring and check for incomplete content
  useEffect(() => {
    performanceMonitor.startMeasurement('course-learning-page-load');
    
    // Check and recover content if needed
    if (courseId && user) {
      checkAndRecoverContent(courseId, user.id).catch(error => {
        console.error('Content recovery check failed:', error);
      });
    }
    
    return () => {
      performanceMonitor.endMeasurement('course-learning-page-load');
    };
  }, [courseId, user?.id]);

  // Early return for invalid courseId
  if (!courseId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-3 xs:p-6">
        <PageIntro
          title="Invalid Course"
          description="No course ID provided in the URL"
        />
        <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-4 mt-4">
          <EnhancedButton onClick={() => navigate("/courses")} variant="gradient" size="sm">
            <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
            Back to Courses
          </EnhancedButton>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsTrackingWrapper courseId={courseId} moduleId="">
      <OptimizedLearningInterface />
    </AnalyticsTrackingWrapper>
  );
}
