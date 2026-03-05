import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PhasedCourseGenerator } from '@/components/course/PhasedCourseGenerator';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export function CourseGenerationProgressPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<GenerationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !sessionId) {
      navigate('/courses');
      return;
    }

    loadSession();
  }, [user, sessionId, navigate]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: sessionData, error: sessionError } = await supabase
        .from('generation_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user?.id)
        .single();

      if (sessionError) {
        throw new Error('Session not found or access denied');
      }

      setSession(sessionData);

      // If session is completed and has a course, redirect to course view
      if (sessionData.status === 'completed' && sessionData.course_id) {
        toast({
          title: "Course Ready!",
          description: "Your course generation is complete. Redirecting to course view.",
        });
        navigate(`/courses/${sessionData.course_id}`);
        return;
      }

    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load generation session');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseCreated = (course: any) => {
    if (course?.id) {
      toast({
        title: "Course Generated Successfully!",
        description: `Your course "${course.title}" is now ready for learning.`,
      });
      navigate(`/courses/${course.id}`);
    } else {
      navigate('/courses');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading generation session...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Session Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                {error || 'The requested generation session could not be found.'}
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/courses')} className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Courses
                </Button>
                <Button variant="outline" onClick={() => navigate('/create-course')}>
                  Start New Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render the existing PhasedCourseGenerator with background session data
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6">
        <div className="max-w-4xl mx-auto mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </div>
        
        <PhasedCourseGenerator
          formData={session.form_data}
          onCourseCreated={handleCourseCreated}
          backgroundSession={session}
        />
      </div>
    </div>
  );
}