
import React, { useEffect } from 'react';
import { useContentAnalytics } from '@/hooks/useContentAnalytics';

interface AnalyticsTrackingWrapperProps {
  courseId: string;
  moduleId: string;
  children: React.ReactNode;
}

export const AnalyticsTrackingWrapper: React.FC<AnalyticsTrackingWrapperProps> = ({
  courseId,
  moduleId,
  children
}) => {
  const {
    analytics,
    trackPause,
    trackResume,
    trackReplay,
    trackInteraction,
    saveAnalytics
  } = useContentAnalytics(courseId, moduleId);

  // Track visibility changes (tab switching, minimizing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackPause();
      } else {
        trackResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [trackPause, trackResume]);

  // Track clicks and interactions
  useEffect(() => {
    const handleClick = () => trackInteraction();
    const handleKeyDown = () => trackInteraction();

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [trackInteraction]);

  // Save analytics on component unmount
  useEffect(() => {
    return () => {
      saveAnalytics();
    };
  }, [saveAnalytics]);

  return (
    <div className="analytics-wrapper">
      {children}
      
      {/* Analytics Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs max-w-xs">
          <div>Reading Time: {Math.floor(analytics.readingTime / 60)}m {analytics.readingTime % 60}s</div>
          <div>Scroll: {analytics.scrollProgress}%</div>
          <div>Interactions: {analytics.interactionCount}</div>
          <div>Pauses: {analytics.pauseCount}</div>
        </div>
      )}
    </div>
  );
};
