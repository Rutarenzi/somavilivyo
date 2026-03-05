import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Course {
  id: string;
  title: string;
  description: string;
  skill_area: string;
  difficulty_level: string;
  estimated_duration: string;
  category?: string;
  topics: any[];
  status: string;
  created_at: string;
  is_shared?: boolean;
  shared_by?: string;
}

export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCourses = async (retryCount = 0) => {
    console.log('🔍 fetchCourses called, user:', user?.id, 'retry:', retryCount);
    
    if (!user) {
      console.log('❌ No user found, stopping course fetch');
      setLoading(false);
      setError("Please sign in to view courses");
      return;
    }

    setError(null);
    
    try {
      console.log('📡 Fetching owned courses for user:', user.id);
      
      // Fetch owned courses with optimized query (only select needed fields)
      const { data: ownedCourses, error: ownedError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          skill_area,
          difficulty_level,
          estimated_duration,
          category,
          topics,
          status,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit results to prevent timeout

      console.log('📚 Owned courses result:', { data: ownedCourses, error: ownedError });

      if (ownedError) {
        console.error('❌ Error fetching owned courses:', ownedError);
        
        // Handle timeout errors specifically
        if (ownedError.code === '57014') {
          console.warn('🕐 Database timeout occurred, implementing fallback strategy');
          // For timeout errors, show a more helpful message and retry
          if (retryCount < 1) {
            console.log('🔄 Retrying with simpler query due to timeout');
            setTimeout(() => fetchCourses(retryCount + 1), 2000);
            return;
          } else {
            setError("Courses are taking longer to load than expected. Please refresh the page or contact support if this persists.");
            setLoading(false);
            return;
          }
        }
      }

      // Fetch shared courses (with error handling)
      console.log('🤝 Fetching shared courses for user:', user.id);
      
      let sharedCourses = null;
      let sharedError = null;
      
      try {
        const sharedResult = await supabase
          .from('shared_course_access')
          .select(`
            course_id,
            granted_by,
            courses!inner(
              id,
              title,
              description,
              skill_area,
              difficulty_level,
              estimated_duration,
              category,
              topics,
              status,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .limit(20); // Limit shared courses too
          
        sharedCourses = sharedResult.data;
        sharedError = sharedResult.error;
      } catch (err) {
        console.warn('🤝 Shared courses query failed, continuing without shared courses:', err);
        sharedCourses = [];
        sharedError = null; // Don't fail the entire operation for shared courses
      }

      console.log('🤝 Shared courses result:', { data: sharedCourses, error: sharedError });

      if (sharedError) {
        console.error('❌ Error fetching shared courses (non-fatal):', sharedError);
        sharedCourses = []; // Continue without shared courses
      }

      // Combine and transform courses
      const allCourses: Course[] = [
        ...(ownedCourses || []).map(course => ({
          id: course.id,
          title: course.title,
          description: course.description || '',
          skill_area: course.skill_area,
          difficulty_level: course.difficulty_level,
          estimated_duration: course.estimated_duration || '',
          topics: Array.isArray(course.topics) ? course.topics : [],
          status: course.status || 'draft',
          created_at: course.created_at,
          is_shared: false
        })),
        ...(sharedCourses || []).map(item => ({
          id: item.courses.id,
          title: item.courses.title,
          description: item.courses.description || '',
          skill_area: item.courses.skill_area,
          difficulty_level: item.courses.difficulty_level,
          estimated_duration: item.courses.estimated_duration || '',
          topics: Array.isArray(item.courses.topics) ? item.courses.topics : [],
          status: item.courses.status || 'draft',
          created_at: item.courses.created_at,
          is_shared: true,
          shared_by: item.granted_by
        }))
      ];
      
      console.log('✅ All courses combined:', allCourses.length, 'courses');
      setCourses(allCourses);
      setError(null);
    } catch (error) {
      console.error('❌ Unexpected error fetching courses:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load courses: ${errorMessage}`);
      
      // Retry logic for transient errors
      if (retryCount < 2) {
        const shouldRetry = errorMessage.includes('network') || 
                           errorMessage.includes('timeout') || 
                           errorMessage.includes('statement timeout') ||
                           error.code === '57014';
                           
        if (shouldRetry) {
          console.log(`🔄 Retrying course fetch (attempt ${retryCount + 1})`);
          setTimeout(() => fetchCourses(retryCount + 1), 2000 * (retryCount + 1));
          return;
        }
      }
      
      toast({
        title: "Error Loading Courses",
        description: "Failed to load courses. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      console.log('🏁 Course fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const updateCourse = async (courseId: string, updateData: Partial<Course>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to update courses.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating course:', error);
        toast({
          title: "Update Failed",
          description: "Failed to update the course. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Update the course in local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, ...updateData } as Course
            : course
        )
      );
      
      return true;
    } catch (error) {
      console.error('Unexpected error updating course:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the course.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to delete courses.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting course:', error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete the course. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Remove the course from local state
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
      
      toast({
        title: "Course Deleted",
        description: "The course has been successfully deleted.",
      });
      
      return true;
    } catch (error) {
      console.error('Unexpected error deleting course:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the course.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  return { courses, loading, error, refetch: fetchCourses, updateCourse, deleteCourse };
};
