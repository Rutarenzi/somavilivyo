
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAdaptiveLearning } from '@/hooks/useAdaptiveLearning';
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Clock, Target } from 'lucide-react';

interface AdaptiveLearningWrapperProps {
  children: React.ReactNode;
  currentModuleId?: string;
}

export function AdaptiveLearningWrapper({ children, currentModuleId }: AdaptiveLearningWrapperProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  const {
    learningProfile,
    recommendations,
    predictions,
    loading,
    updateLearningProfile
  } = useAdaptiveLearning(courseId || '');

  const {
    sessionId,
    initializeSession,
    trackScrollBehavior,
    trackInteraction,
    trackConfidence
  } = useEnhancedAnalytics(courseId || '', currentModuleId || '');

  // Initialize analytics session when module changes
  useEffect(() => {
    if (currentModuleId) {
      initializeSession();
    }
  }, [currentModuleId, initializeSession]);

  // Track scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      trackScrollBehavior(scrollPosition, maxScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackScrollBehavior]);

  // Track general interactions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      trackInteraction('click', target.tagName.toLowerCase(), {
        className: target.className,
        id: target.id
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [trackInteraction]);

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'difficulty': return <Target className="h-4 w-4" />;
      case 'pacing': return <Clock className="h-4 w-4" />;
      case 'content_format': return <Brain className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (confidence: number) => {
    if (confidence > 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence > 0.6) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (loading) {
    return <div className="relative">{children}</div>;
  }

  return (
    <div className="relative">
      {/* AI Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="fixed top-20 right-4 z-40">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="mb-2 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 hover:from-purple-100 hover:to-pink-100"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Insights ({recommendations.length})
          </Button>
          
          {showRecommendations && (
            <Card className="w-80 max-h-96 overflow-y-auto p-4 bg-white shadow-lg border-purple-200">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center text-purple-700">
                  <Brain className="h-4 w-4 mr-2" />
                  Personalized Learning Insights
                </h3>
                
                {recommendations.map((rec, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getRecommendationColor(rec.confidence)}>
                        {getRecommendationIcon(rec.type)}
                        <span className="ml-1 capitalize">{rec.type}</span>
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {Math.round(rec.confidence * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{rec.reason}</p>
                  </div>
                ))}

                {learningProfile && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Your Learning Style</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Visual:</span>
                        <span>{Math.round(learningProfile.content_preferences.visual * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Pacing:</span>
                        <span className="capitalize">{learningProfile.pacing_preference}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Session:</span>
                        <span>{learningProfile.optimal_session_duration}min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Performance Predictions */}
      {predictions.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Card className="w-72 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Insights
            </h4>
            {predictions.slice(0, 2).map((pred, index) => (
              <div key={index} className="text-xs text-blue-600 mb-1">
                <span className="capitalize">{pred.prediction_type}:</span>
                <span className="ml-2 font-medium">
                  {typeof pred.predicted_value === 'object' 
                    ? JSON.stringify(pred.predicted_value).slice(0, 30) + '...'
                    : String(pred.predicted_value)
                  }
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Confidence Rating Widget */}
      {currentModuleId && (
        <div className="fixed bottom-4 left-4 z-40">
          <Card className="p-3 bg-white shadow-md border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">How confident do you feel?</h4>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 text-xs"
                  onClick={() => trackConfidence(currentModuleId, rating)}
                >
                  {rating}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Main content */}
      <div className="adaptive-learning-content">
        {children}
      </div>
    </div>
  );
}
