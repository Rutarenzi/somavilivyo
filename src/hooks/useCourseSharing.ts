
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useCourseSharing = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, session } = useAuth();

  const shareCourse = async (courseId: string, emails: string | string[], message?: string) => {
    console.log('=== Share Course Started ===');
    console.log('User:', user?.id, user?.email);
    console.log('Session exists:', !!session);
    console.log('Course ID:', courseId);
    console.log('Invited emails:', emails);

    if (!user || !session) {
      console.error('No user or session found');
      toast({
        title: "Error",
        description: "You must be logged in to share courses",
        variant: "destructive"
      });
      return false;
    }

    // Convert single email to array for consistency
    const emailArray = Array.isArray(emails) ? emails : [emails];
    
    if (emailArray.length === 0) {
      toast({
        title: "Error",
        description: "Please provide at least one email address",
        variant: "destructive"
      });
      return false;
    }

    if (emailArray.length > 60) {
      toast({
        title: "Error",
        description: "You can only share with up to 60 people at once",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Calling send-course-invitation function for bulk sharing...');
      const { data, error } = await supabase.functions.invoke('send-course-invitation', {
        body: {
          courseId,
          invitedEmails: emailArray, // Send as array for bulk processing
          message
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('Course invitations sent successfully');
      
      const successCount = data?.successCount || emailArray.length;
      const failureCount = data?.failureCount || 0;
      
      if (failureCount > 0) {
        toast({
          title: "Partially Successful",
          description: `${successCount} invitations sent successfully. ${failureCount} failed.`,
        });
      } else {
        toast({
          title: "Success",
          description: `All ${successCount} course invitation${successCount === 1 ? '' : 's'} sent successfully!`,
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error sharing course:', error);
      
      // Provide more specific error messages
      let errorMessage = "Failed to send course invitations. Please try again.";
      
      if (error?.message?.includes('Unauthorized')) {
        errorMessage = "You don't have permission to share this course.";
      } else if (error?.message?.includes('not found')) {
        errorMessage = "Course not found or you don't have access to it.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    console.log('=== Handle Invitation Started ===');
    console.log('User:', user?.id, user?.email);
    console.log('Session exists:', !!session);
    console.log('Invitation ID:', invitationId);
    console.log('Action:', action);

    if (!user || !session) {
      console.error('No user or session found');
      toast({
        title: "Error",
        description: "You must be logged in to handle invitations",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('Calling handle-course-invitation function...');
      const { data, error } = await supabase.functions.invoke('handle-course-invitation', {
        body: {
          invitationId,
          action
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('Invitation handled successfully');
      toast({
        title: "Success",
        description: `Invitation ${action}ed successfully!`,
      });
      return true;
    } catch (error) {
      console.error('Error handling invitation:', error);
      
      // Provide more specific error messages
      let errorMessage = `Failed to ${action} invitation. Please try again.`;
      
      if (error?.message?.includes('Unauthorized')) {
        errorMessage = "You don't have permission to handle this invitation.";
      } else if (error?.message?.includes('not found')) {
        errorMessage = "Invitation not found or has expired.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    shareCourse,
    handleInvitation,
    loading
  };
};
