
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CourseEditRequest {
  editType: 'add_modules' | 'edit_content' | 'restructure';
  editRequest: string;
  targetPath?: string;
  currentContent?: any;
  additionalContext?: string;
}

export const useCourseEditor = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  const editCourse = useCallback(async (courseId: string, editRequest: CourseEditRequest) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to edit courses.",
        variant: "destructive",
      });
      return null;
    }

    if (!courseId || !editRequest.editRequest.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a valid course ID and edit request.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    setProgress(0);
    
    try {
      console.log('🚀 Starting course edit:', { courseId, editType: editRequest.editType });
      
      setCurrentOperation(`Processing ${editRequest.editType.replace('_', ' ')} request...`);
      setProgress(20);

      // Call the edit-course edge function with proper error handling
      const { data, error } = await supabase.functions.invoke('edit-course', {
        body: {
          userId: user.id,
          courseId,
          ...editRequest
        }
      });

      setProgress(40);

      if (error) {
        console.error('Course edit error:', error);
        
        // Handle different types of errors
        let errorMessage = "Failed to edit your course. Please try again.";
        
        if (error.message?.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message?.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Course Edit Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return null;
      }

      setProgress(60);
      setCurrentOperation('Processing AI response...');

      if (!data) {
        console.error('No data returned from edge function');
        toast({
          title: "Course Edit Failed",
          description: "No response from the editing service. Please try again.",
          variant: "destructive",
        });
        return null;
      }

      console.log('✅ Course edit response:', data);

      if (!data.success) {
        console.error('Course edit failed:', data.error);
        toast({
          title: "Course Edit Failed",
          description: data.error || 'Course editing failed. Please try again.',
          variant: "destructive",
        });
        return null;
      }

      setProgress(80);
      setCurrentOperation('Finalizing updates...');

      // Artificial delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentOperation('Course edit completed successfully!');
      setProgress(100);

      toast({
        title: "Course Updated Successfully!",
        description: `Your course has been updated with the requested ${editRequest.editType.replace('_', ' ')}.`,
      });

      return data.updatedCourse;

    } catch (error) {
      console.error('Unexpected course edit error:', error);
      
      let errorMessage = "An unexpected error occurred during course editing. Please try again.";
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = "Network connection error. Please check your internet connection and try again.";
      }
      
      toast({
        title: "Course Edit Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
        setCurrentOperation('');
      }, 2000);
    }
  }, [user, toast]);

  const addModules = useCallback(async (courseId: string, request: string, targetPath?: string, currentContent?: any) => {
    return editCourse(courseId, {
      editType: 'add_modules',
      editRequest: request,
      targetPath,
      currentContent
    });
  }, [editCourse]);

  const editContent = useCallback(async (courseId: string, request: string, targetPath: string, currentContent: any, additionalContext?: string) => {
    return editCourse(courseId, {
      editType: 'edit_content',
      editRequest: request,
      targetPath,
      currentContent,
      additionalContext
    });
  }, [editCourse]);

  const restructureCourse = useCallback(async (courseId: string, request: string, additionalContext?: string) => {
    return editCourse(courseId, {
      editType: 'restructure',
      editRequest: request,
      additionalContext
    });
  }, [editCourse]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    setCurrentOperation('');
  }, []);

  return { 
    editCourse,
    addModules,
    editContent,
    restructureCourse,
    loading, 
    progress, 
    currentOperation, 
    resetProgress 
  };
};
