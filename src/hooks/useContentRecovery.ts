import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useContentRecovery = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const recoverCourseContent = async (courseId: string, userId: string) => {
    setLoading(true);
    
    try {
      console.log('🔄 Starting content recovery for course:', courseId);
      
      // Call the content recovery edge function
      const { data, error } = await supabase.functions.invoke('content-recovery', {
        body: { courseId, userId }
      });

      if (error) {
        console.error('Content recovery error:', error);
        toast({
          title: "Content Recovery Failed",
          description: error.message || "Failed to recover course content. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (data.success) {
        toast({
          title: "✅ Content Recovery Complete",
          description: `Successfully recovered content for ${data.recoveredCount} modules`,
        });
        return true;
      } else {
        throw new Error(data.error || 'Content recovery failed');
      }
    } catch (error) {
      console.error('Unexpected content recovery error:', error);
      toast({
        title: "Recovery Error",
        description: "An unexpected error occurred during content recovery.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkAndRecoverContent = async (courseId: string, userId: string) => {
    try {
      // Check if course has modules with incomplete content
      const { data: modules, error } = await supabase
        .from('micro_modules')
        .select('id, title, content')
        .eq('course_id', courseId);

      if (error) {
        console.error('Error checking modules:', error);
        return false;
      }

      let incompleteCount = 0;
      modules?.forEach(module => {
        try {
          let content: any = module.content;
          if (typeof content === 'string') {
            content = JSON.parse(content);
          }

          if (!content || 
              typeof content !== 'object' ||
              !content.mainContent || 
              content.mainContent.length < 200 ||
              content.mainContent.includes('Placeholder content') ||
              content.mainContent.includes('Generation might have been incomplete')) {
            incompleteCount++;
          }
        } catch {
          incompleteCount++;
        }
      });

      if (incompleteCount > 0) {
        console.log(`Found ${incompleteCount} modules needing content recovery`);
        return await recoverCourseContent(courseId, userId);
      } else {
        console.log('All modules have complete content');
        return true;
      }
    } catch (error) {
      console.error('Error in content check:', error);
      return false;
    }
  };

  return {
    recoverCourseContent,
    checkAndRecoverContent,
    loading
  };
};