import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PhasedCourseGenerator } from './PhasedCourseGenerator';

interface GenerationSession {
  id: string;
  user_id: string;
  status: string;
  current_phase: number;
  total_phases: number;
  form_data: any;
  phases_data: any;
  created_at: string;
  last_activity: string;
  error_message?: string;
}

interface CourseGenerationProgressModalProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseGenerationProgressModal({ 
  sessionId, 
  isOpen, 
  onClose 
}: CourseGenerationProgressModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<GenerationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || !user || !isOpen) return;

    const loadSession = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('generation_sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        if (!data) {
          throw new Error('Session not found');
        }

        setSession(data);

        // If session is completed, redirect to course view
        if (data.status === 'completed' && typeof data.phases_data === 'object' && data.phases_data !== null) {
          const phasesData = data.phases_data as any;
          if (phasesData.finalizedCourse?.id) {
            navigate(`/courses/${phasesData.finalizedCourse.id}`);
            onClose();
            return;
          }
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, user, isOpen, navigate, onClose]);

  const handleCourseCreated = (course: any) => {
    toast({
      title: "Course Created Successfully!",
      description: `Your course "${course.title}" has been generated.`,
    });
    
    navigate(`/courses/${course.id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Generation Progress</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Loading session...</span>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <p className="text-muted-foreground">
                The session may have been completed or removed.
              </p>
            </div>
          )}
          
          {session && !loading && !error && (
            <PhasedCourseGenerator
              formData={session.form_data}
              onCourseCreated={handleCourseCreated}
              backgroundSession={session}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}