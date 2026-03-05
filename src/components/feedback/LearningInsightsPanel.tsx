
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Clock,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useLearningInsights } from '@/hooks/useLearningInsights';

interface LearningInsightsPanelProps {
  courseId: string;
  className?: string;
}

export const LearningInsightsPanel: React.FC<LearningInsightsPanelProps> = ({ 
  courseId, 
  className = '' 
}) => {
  const { insights, competencies, loading, generateInsights } = useLearningInsights(courseId);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </CardContent>
      </Card>
    );
  }

  const priorityInsights = insights
    .filter(insight => insight.priority >= 3)
    .slice(0, 3);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'weakness': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'recommendation': return <Target className="h-4 w-4 text-blue-500" />;
      case 'prediction': return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default: return <Brain className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-green-100 text-green-800';
      case 'weakness': return 'bg-orange-100 text-orange-800';
      case 'recommendation': return 'bg-blue-100 text-blue-800';
      case 'prediction': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Insights Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Learning Insights</span>
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your learning patterns
              </CardDescription>
            </div>
            <Button 
              onClick={generateInsights} 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {priorityInsights.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet.</p>
              <p className="text-sm mt-2">Continue learning to generate personalized recommendations!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {priorityInsights.map((insight) => (
                <div 
                  key={insight.id} 
                  className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getInsightIcon(insight.insight_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {insight.title}
                      </h4>
                      <Badge className={`text-xs ${getInsightBadgeColor(insight.insight_type)}`}>
                        {insight.insight_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {insight.description}
                    </p>
                    {insight.action_items.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-700">Next Steps:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {insight.action_items.slice(0, 2).map((action, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-indigo-500" />
            <span>Skills Progress</span>
          </CardTitle>
          <CardDescription>
            Track your competency development across key areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {competencies.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No skills tracked yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {competencies.slice(0, 4).map((competency) => (
                <div key={competency.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {competency.competency_name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {competency.current_level}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {competency.mastery_percentage}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={competency.mastery_percentage} 
                    className="h-2"
                  />
                  {competency.skill_gaps.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">
                        {competency.skill_gaps.length} area{competency.skill_gaps.length !== 1 ? 's' : ''} to improve
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Study Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0">
                <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Optimal Study Time</p>
                <p className="text-xs text-blue-700 mt-1">
                  Based on your patterns, you learn best between 2-4 PM
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Strength Area</p>
                <p className="text-xs text-green-700 mt-1">
                  You excel at practical applications - leverage this strength!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
