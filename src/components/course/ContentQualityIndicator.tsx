import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lightbulb, 
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ContentQualityValidator, ContentQualityResult } from '@/utils/contentQualityValidator';
import { cn } from '@/lib/utils';

interface ContentQualityIndicatorProps {
  content: string;
  title: string;
  quiz?: any;
  moduleId?: string;
  courseId?: string;
  className?: string;
  onEnhancementRequested?: () => void;
}

export function ContentQualityIndicator({
  content,
  title,
  quiz,
  moduleId,
  courseId,
  className,
  onEnhancementRequested
}: ContentQualityIndicatorProps) {
  const [qualityResult, setQualityResult] = useState<ContentQualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    validateContent();
  }, [content, title, quiz]);

  const validateContent = async () => {
    if (!content || content.length < 10) return;
    
    setLoading(true);
    try {
      const result = await ContentQualityValidator.validateContent(
        content, 
        title, 
        quiz, 
        moduleId, 
        courseId
      );
      setQualityResult(result);
    } catch (error) {
      console.error('Content validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("p-3 border border-gray-200 rounded-lg bg-gray-50", className)}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm text-gray-600">Analyzing content quality...</span>
        </div>
      </div>
    );
  }

  if (!qualityResult) return null;

  const { metrics, feedback, improvements } = qualityResult;
  
  const getQualityIcon = () => {
    if (metrics.qualityScore >= 85) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (metrics.qualityScore >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getQualityColor = () => {
    if (metrics.qualityScore >= 85) return "text-green-600 bg-green-50 border-green-200";
    if (metrics.qualityScore >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getQualityLabel = () => {
    if (metrics.qualityScore >= 85) return "Excellent";
    if (metrics.qualityScore >= 70) return "Good";
    if (metrics.qualityScore >= 50) return "Fair";
    return "Needs Work";
  };

  return (
    <Card className={cn("border-l-4", getQualityColor(), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getQualityIcon()}
            <CardTitle className="text-sm font-medium">
              Content Quality: {getQualityLabel()}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {metrics.qualityScore}/100
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        <Progress value={metrics.qualityScore} className="h-2" />
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {/* Quality Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <QualityMetricItem
              label="Structure"
              value={metrics.structuralCompleteness}
              icon={<BarChart3 className="h-3 w-3" />}
            />
            <QualityMetricItem
              label="Diversity"
              value={metrics.contentDiversityScore}
              icon={<Zap className="h-3 w-3" />}
            />
            <QualityMetricItem
              label="Length"
              value={Math.min(100, (metrics.contentLength / 200) * 100)}
              icon={<span className="text-xs">{metrics.contentLength}ch</span>}
            />
          </div>

          {/* Content Features */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <FeatureIndicator 
              label="Introduction" 
              present={metrics.hasIntroduction} 
            />
            <FeatureIndicator 
              label="Examples" 
              present={metrics.hasExamples} 
            />
            <FeatureIndicator 
              label="Summary" 
              present={metrics.hasSummary} 
            />
            <FeatureIndicator 
              label="Quiz" 
              present={metrics.hasQuiz} 
            />
          </div>

          {/* Feedback */}
          {feedback.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback:</h4>
              <ul className="space-y-1">
                {feedback.map((item, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Lightbulb className="h-3 w-3" />
                <span>Suggestions:</span>
              </h4>
              <ul className="space-y-1">
                {improvements.map((item, index) => (
                  <li key={index} className="text-xs text-blue-600 flex items-start space-x-1">
                    <span className="flex-shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enhancement Button */}
          {metrics.needsEnhancement && onEnhancementRequested && (
            <Button
              onClick={onEnhancementRequested}
              size="sm"
              variant="outline"
              className="w-full text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Enhance Content Quality
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function QualityMetricItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
}) {
  const getColor = () => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center space-x-1">
      {icon}
      <span className="text-xs text-gray-600">{label}:</span>
      <span className={cn("text-xs font-medium", getColor())}>
        {Math.round(value)}%
      </span>
    </div>
  );
}

function FeatureIndicator({ 
  label, 
  present 
}: { 
  label: string; 
  present: boolean;
}) {
  return (
    <div className="flex items-center space-x-1">
      {present ? (
        <CheckCircle2 className="h-3 w-3 text-green-600" />
      ) : (
        <XCircle className="h-3 w-3 text-gray-400" />
      )}
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}