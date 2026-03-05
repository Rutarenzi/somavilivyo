
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Brain, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PersonalizationSettingsProps {
  profile: {
    content_preferences: {
      visual: number;
      auditory: number;
      kinesthetic: number;
    };
    pacing_preference: string;
    difficulty_preference: string;
    optimal_session_duration: number;
  };
  onUpdate: (updates: any) => Promise<void>;
}

export function PersonalizationSettings({ profile, onUpdate }: PersonalizationSettingsProps) {
  const [localProfile, setLocalProfile] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSliderChange = (type: 'visual' | 'auditory' | 'kinesthetic', value: number[]) => {
    const newValue = value[0] / 100;
    const others = Object.keys(localProfile.content_preferences).filter(k => k !== type) as Array<'visual' | 'auditory' | 'kinesthetic'>;
    const remainingTotal = (100 - value[0]) / 100;
    const currentOthersTotal = others.reduce((sum, key) => sum + localProfile.content_preferences[key], 0);
    
    const newPreferences = { ...localProfile.content_preferences };
    newPreferences[type] = newValue;
    
    // Redistribute remaining percentage to other preferences
    if (currentOthersTotal > 0) {
      others.forEach(key => {
        newPreferences[key] = (newPreferences[key] / currentOthersTotal) * remainingTotal;
      });
    } else {
      // If others are 0, distribute equally
      const equalShare = remainingTotal / others.length;
      others.forEach(key => {
        newPreferences[key] = equalShare;
      });
    }

    setLocalProfile(prev => ({
      ...prev,
      content_preferences: newPreferences
    }));
    setHasChanges(true);
  };

  const handlePreferenceChange = (field: string, value: string | number) => {
    setLocalProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(localProfile);
      setHasChanges(false);
      toast.success('Learning preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update preferences');
      console.error('Error updating preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalProfile(profile);
    setHasChanges(false);
    toast.info('Settings reset to current saved preferences');
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
              <Settings className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Personalization Settings</h2>
              <p className="text-sm text-gray-600">Customize your learning experience with AI-powered adaptations</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-pink-50">
            <Brain className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>

        {/* Learning Style Preferences */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-800">Learning Style Preferences</h3>
          <p className="text-sm text-gray-600">
            Adjust how you prefer to receive and process information. The AI will adapt content accordingly.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Visual Learning</Label>
                <span className="text-sm text-gray-500">
                  {Math.round(localProfile.content_preferences.visual * 100)}%
                </span>
              </div>
              <Slider
                value={[localProfile.content_preferences.visual * 100]}
                onValueChange={(value) => handleSliderChange('visual', value)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Prefer diagrams, charts, images, and visual explanations</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Auditory Learning</Label>
                <span className="text-sm text-gray-500">
                  {Math.round(localProfile.content_preferences.auditory * 100)}%
                </span>
              </div>
              <Slider
                value={[localProfile.content_preferences.auditory * 100]}
                onValueChange={(value) => handleSliderChange('auditory', value)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Prefer audio explanations, discussions, and verbal instructions</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Kinesthetic Learning</Label>
                <span className="text-sm text-gray-500">
                  {Math.round(localProfile.content_preferences.kinesthetic * 100)}%
                </span>
              </div>
              <Slider
                value={[localProfile.content_preferences.kinesthetic * 100]}
                onValueChange={(value) => handleSliderChange('kinesthetic', value)}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Prefer hands-on activities, interactive exercises, and practical examples</p>
            </div>
          </div>
        </div>

        {/* Pacing and Difficulty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Learning Pace</Label>
            <Select 
              value={localProfile.pacing_preference} 
              onValueChange={(value) => handlePreferenceChange('pacing_preference', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow & Steady</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="fast">Fast Track</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">How quickly do you prefer to move through content?</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Difficulty Preference</Label>
            <Select 
              value={localProfile.difficulty_preference} 
              onValueChange={(value) => handlePreferenceChange('difficulty_preference', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy Start</SelectItem>
                <SelectItem value="moderate">Moderate Challenge</SelectItem>
                <SelectItem value="challenging">High Challenge</SelectItem>
                <SelectItem value="adaptive">Adaptive (Recommended)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Adaptive mode adjusts difficulty based on your performance</p>
          </div>
        </div>

        {/* Session Duration */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Optimal Session Duration</Label>
          <div className="space-y-2">
            <Slider
              value={[localProfile.optimal_session_duration]}
              onValueChange={(value) => handlePreferenceChange('optimal_session_duration', value[0])}
              min={15}
              max={120}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>15 min</span>
              <span className="font-medium">{localProfile.optimal_session_duration} minutes</span>
              <span>120 min</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            The AI will suggest breaks and optimize content pacing based on this duration
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </Button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save Preferences" to apply your personalization settings.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
