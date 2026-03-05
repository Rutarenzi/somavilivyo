import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Eye, X, Minimize2, Maximize2, Move } from 'lucide-react';
import { subscriptionManager } from '@/utils/subscriptionManager';

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

interface MovableBackgroundJobMonitorProps {
  onShowProgress: (sessionId: string) => void;
}

export function MovableBackgroundJobMonitor({ onShowProgress }: MovableBackgroundJobMonitorProps) {
  const { user } = useAuth();
  const [activeSessions, setActiveSessions] = useState<BackgroundGenerationSession[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

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
          if (session && (session.status === 'failed' || session.status === 'cancelled' || session.status === 'completed')) {
            setActiveSessions(prev => prev.filter(s => s.id !== session.id));
            checkActiveSessions(); // Refresh to ensure consistency
            return;
          }
        }
        
        checkActiveSessions();
      }
    );

    // Periodic check every 30 seconds
    const interval = setInterval(checkActiveSessions, 30000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [user]);

  // Initialize position to bottom-right corner
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 380, // Card width + some margin
        y: window.innerHeight - 200 // Estimated card height + margin
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && (
      e.target.closest('button') || 
      e.target.closest('[role="button"]') ||
      e.target.closest('.progress')
    )) {
      return; // Don't start dragging if clicking on interactive elements
    }
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

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
    <div 
      ref={cardRef}
      className="fixed z-50 max-w-sm cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className="shadow-2xl bg-white/95 backdrop-blur-xl border-primary/20 transition-all duration-200 hover:shadow-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary-foreground animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Course Generation</h3>
                <p className="text-xs text-muted-foreground">{activeSessions.length} active</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Move className="h-3 w-3 text-muted-foreground" />
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
                        <span className="text-xs text-muted-foreground">
                          {Math.round(calculateProgress(session))}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewProgress(session.id)}
                        className="h-6 w-6 p-0 text-primary hover:text-primary/80"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismissSession(session.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <Progress value={calculateProgress(session)} className="h-2" />

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3 animate-pulse text-primary" />
                    <span>Generating in background...</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
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