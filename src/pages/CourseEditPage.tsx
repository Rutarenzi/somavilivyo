
import { useParams, useNavigate } from "react-router-dom";
import { useCourses } from "@/hooks/useCourses";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { PageIntro } from "@/components/layout/PageIntro";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ComprehensiveCourseEditor } from "@/components/course/ComprehensiveCourseEditor";

export default function CourseEditPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { courses, loading, updateCourse } = useCourses();

  const course = courses.find(c => c.id === courseId);

  const handleCourseUpdate = async (updatedCourse: any) => {
    if (course) {
      const success = await updateCourse(course.id, updatedCourse);
      if (success) {
        console.log('Course updated successfully');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] p-3 xs:p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 xs:h-12 w-12 animate-spin text-indigo-600 mx-auto mb-3 xs:mb-4" />
          <p className="text-sm xs:text-base text-gray-600 font-inter">Loading course editor...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-3 xs:p-6">
        <PageIntro
          title="Hang on for some seconds"
          description="Your course is on the way"
        />
        <EnhancedButton onClick={() => navigate("/courses")} variant="gradient" size="sm" className="xs:size-lg mt-4">
          <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
          Back to Courses
        </EnhancedButton>
      </div>
    );
  }

  return (
    <div className="p-3 xs:p-4 md:p-6"> 
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 xs:mb-6 gap-3 xs:gap-4">
          <EnhancedButton 
            onClick={() => navigate(`/courses/${courseId}`)} 
            variant="outline"
            size="sm"
            className="glass bg-white/60 backdrop-blur-sm border-gray-300 hover:bg-white/80 self-start xs:self-auto"
          >
            <ArrowLeft className="h-3 w-3 xs:h-4 w-4 mr-1 xs:mr-2" />
            <span className="text-xs xs:text-sm">Back to Course</span>
          </EnhancedButton>
        </div>
        
        <div className="mb-6 xs:mb-8">
          <PageIntro
            title={`Edit: ${course.title}`}
            description="Comprehensive course editing with AI assistance and full manual control. Edit every aspect of your course content and structure."
          />
        </div>

        <div className="mt-6 xs:mt-8">
          <ComprehensiveCourseEditor 
            course={course}
            onUpdate={handleCourseUpdate}
          />
        </div>
      </div>
    </div>
  );
}
