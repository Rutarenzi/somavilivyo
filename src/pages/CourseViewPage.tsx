
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useOptimizedCoursesEnhanced } from "@/hooks/useOptimizedCoursesEnhanced";
import { CourseContentDisplay } from "@/components/CourseContentDisplay";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { PageIntro } from "@/components/layout/PageIntro";
import { PreFetchingOptimizer } from "@/components/course/PreFetchingOptimizer";
import { ArrowLeft, Loader2, Edit, Play } from "lucide-react";

export default function CourseViewPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses, initialLoading: loading, fetchCourseDetails } = useOptimizedCoursesEnhanced();
  const [courseDetails, setCourseDetails] = useState<{ topics: any[] } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const course = courses.find(c => c.id === courseId);

  // Fetch course details (topics) when course is found
  useEffect(() => {
    const loadCourseDetails = async () => {
      if (course && courseId && !courseDetails) {
        setDetailsLoading(true);
        try {
          const details = await fetchCourseDetails(courseId);
          setCourseDetails(details as { topics: any[] } | null);
        } catch (error) {
          console.error('Failed to load course details:', error);
        } finally {
          setDetailsLoading(false);
        }
      }
    };

    loadCourseDetails();
  }, [course, courseId, courseDetails, fetchCourseDetails]);

  if (loading || detailsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-3 xs:p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 xs:h-12 w-12 animate-spin text-indigo-600 mx-auto mb-3 xs:mb-4" />
          <p className="text-sm xs:text-base text-gray-600 font-inter">
            {loading ? 'Loading course...' : 'Loading syllabus...'}
          </p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-3 xs:p-6">
        <PageIntro
          title="Waiting for Course"
          description="Hand on for some seconds, you course is being fetched"
        />
        <EnhancedButton onClick={() => navigate("/courses")} variant="gradient" size="sm" className="xs:size-lg mt-4">
          <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
          Back to Courses
        </EnhancedButton>
      </div>
    );
  }

  return (
    <PreFetchingOptimizer currentCourseId={courseId}>
      <div className="p-3 xs:p-4 md:p-6"> 
        <div className="max-w-6xl mx-auto">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 xs:mb-6 gap-3 xs:gap-4">
          <EnhancedButton 
            onClick={() => navigate("/courses")} 
            variant="outline"
            size="sm"
            className="glass bg-white/60 backdrop-blur-sm border-gray-300 hover:bg-white/80 self-start xs:self-auto"
          >
            <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
            <span className="text-xs xs:text-sm">Back to Courses</span>
          </EnhancedButton>
          
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center space-y-2 xs:space-y-0 xs:space-x-3">
            <EnhancedButton 
              onClick={() => navigate(`/courses/${courseId}/learn`)}
              variant="gradient"
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Play className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
              <span className="text-xs xs:text-sm">Start Learning</span>
            </EnhancedButton>
            
            <EnhancedButton 
              onClick={() => navigate(`/courses/${courseId}/edit`)}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Edit className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
              <span className="text-xs xs:text-sm">Edit Course</span>
            </EnhancedButton>
          </div>
        </div>
        
        <div className="mb-6 xs:mb-8">
          <PageIntro
            title={course.title}
            description={course.description}
          />
        </div>
        
        <div className="mt-6 xs:mt-8">
          <CourseContentDisplay 
            course={{
              ...course,
              topics: courseDetails?.topics || course.topics || []
            }} 
            progress={course.progress_percentage || 0} 
          />
        </div>
        </div>
      </div>
    </PreFetchingOptimizer>
  );
}
