
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Eye, Headphones, Hand, Clock, Target, TrendingUp } from 'lucide-react';

interface LearningStyleIndicatorProps {
  profile: {
    content_preferences: {
      visual: number;
      auditory: number;
      kinesthetic: number;
    };
    pacing_preference: string;
    difficulty_preference: string;
    optimal_session_duration: number;
    confidence_score: number;
  };
  compact?: boolean;
}

export function LearningStyleIndicator({ profile, compact = false }: LearningStyleIndicatorProps) {
  const { content_preferences, pacing_preference, difficulty_preference, optimal_session_duration, confidence_score } = profile;

  const getDominantLearningStyle = () => {
    const { visual, auditory, kinesthetic } = content_preferences;
    if (visual > auditory && visual > kinesthetic) return 'Visual';
    if (auditory > visual && auditory > kinesthetic) return 'Auditory';
    return 'Kinesthetic';
  };

  const getStyleIcon = (style: string) => {
    switch (style.toLowerCase()) {
      case 'visual': return <Eye className="h-4 w-4" />;
      case 'auditory': return <Headphones className="h-4 w-4" />;
      case 'kinesthetic': return <Hand className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'visual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'auditory': return 'bg-green-100 text-green-800 border-green-200';
      case 'kinesthetic': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const dominantStyle = getDominantLearningStyle();

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className={getStyleColor(dominantStyle)}>
          {getStyleIcon(dominantStyle)}
          <span className="ml-1">{dominantStyle}</span>
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {optimal_session_duration}min
        </Badge>
        <Badge variant="outline" className="text-xs capitalize">
          {pacing_preference}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-purple-700 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Your Learning Profile
          </h3>
          <Badge variant="outline" className="bg-white">
            {Math.round(confidence_score * 100)}% confidence
          </Badge>
        </div>

        {/* Learning Style Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Learning Style Preferences</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Visual</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={content_preferences.visual * 100} className="w-20 h-2" />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(content_preferences.visual * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Headphones className="h-4 w-4 text-green-600" />
                <span className="text-sm">Auditory</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={content_preferences.auditory * 100} className="w-20 h-2" />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(content_preferences.auditory * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Hand className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Kinesthetic</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={content_preferences.kinesthetic * 100} className="w-20 h-2" />
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(content_preferences.kinesthetic * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Pacing</div>
            <Badge variant="outline" className="text-xs capitalize">
              {pacing_preference}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Difficulty</div>
            <Badge variant="outline" className="text-xs capitalize">
              {difficulty_preference}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Session</div>
            <Badge variant="outline" className="text-xs">
              {optimal_session_duration}min
            </Badge>
          </div>
        </div>

        {/* Dominant Style Highlight */}
        <div className="bg-white rounded-lg p-3 border border-purple-200">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${getStyleColor(dominantStyle).replace('border-', 'bg-').replace('text-', '').replace('bg-', 'bg-opacity-20 bg-')}`}>
              {getStyleIcon(dominantStyle)}
            </div>
            <div>
              <div className="font-medium text-sm text-gray-800">
                Dominant Learning Style: {dominantStyle}
              </div>
              <div className="text-xs text-gray-600">
                Content is being optimized for your {dominantStyle.toLowerCase()} learning preference
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
