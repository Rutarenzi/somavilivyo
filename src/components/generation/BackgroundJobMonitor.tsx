import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Eye, X, Minimize2, Maximize2 } from 'lucide-react';

interface BackgroundGenerationSession {
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

interface BackgroundJobMonitorProps {
  onShowProgress: (sessionId: string) => void;
}

export function BackgroundJobMonitor({ onShowProgress }: BackgroundJobMonitorProps) {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<BackgroundGenerationSession[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkActiveSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('generation_sessions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'background_processing'])
          .order('created_at', { ascending: false });

        if (!error && sessions) {
          setActiveSessions(sessions);
          setIsVisible(sessions.length > 0);
        }
      } catch (error) {
        console.error('Error checking active sessions:', error);
      }
    };

    // Initial check
    checkActiveSessions();

    // Import subscription manager
    import('@/utils/subscriptionManager').then(({ subscriptionManager }) => {
      const channelName = `background-generation-${user.id}`;
      
      const unsubscribe = subscriptionManager.subscribe(
        channelName,
        {
          event: '*',
          schema: 'public',
          table: 'generation_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('Session update received:', payload);
          
          // Hide floating window if generation fails or is cancelled
          if (payload.eventType === 'UPDATE') {
            const session = payload.new;
            if (session && (session.status === 'failed' || session.status === 'cancelled')) {
              setActiveSessions(prev => prev.filter(s => s.id !== session.id));
              checkActiveSessions(); // Refresh to ensure consistency
              return;
            }
          }
          
          checkActiveSessions();
        }
      );

      // Store unsubscribe function to call on cleanup
      return unsubscribe;
    });

    // Periodic check every 30 seconds
    const interval = setInterval(checkActiveSessions, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const calculateProgress = (session: BackgroundGenerationSession): number => {
    const phaseProgress = (session.current_phase / session.total_phases) * 100;
    return Math.min(Math.max(phaseProgress, 0), 100);
  };

  const getCurrentPhaseLabel = (session: BackgroundGenerationSession): string => {
    const phases = ['Initializing', 'Topics', 'Subtopics', 'Modules', 'Content', 'Finalizing'];
    return phases[session.current_phase] || 'Processing';
  };

  const handleViewProgress = (sessionId: string) => {
    onShowProgress(sessionId);
  };

  const handleDismissSession = async (sessionId: string) => {
    try {
      // Mark session as cancelled
      await supabase
        .from('generation_sessions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Remove from local state
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error dismissing session:', error);
    }
  };

  if (!isVisible || activeSessions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-2xl bg-white/95 backdrop-blur-xl border-indigo-200/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Course Generation</h3>
                <p className="text-xs text-gray-600">{activeSessions.length} active</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-6 w-6 p-0"
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {session.form_data?.skill || 'Course Generation'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getCurrentPhaseLabel(session)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {Math.round(calculateProgress(session))}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewProgress(session.id)}
                        className="h-6 w-6 p-0 text-indigo-600"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismissSession(session.id)}
                        className="h-6 w-6 p-0 text-gray-400"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={calculateProgress(session)} className="h-2" />

                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Zap className="h-3 w-3 animate-pulse text-indigo-500" />
                    <span>Generating in background...</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Generation continues even if you navigate away
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}