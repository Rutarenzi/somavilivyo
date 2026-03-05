import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Users, Play, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useTruncateContent } from '@/utils/responsiveUtils';

interface ResponsiveCourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string;
    difficulty_level: string;
    skill_area: string;
    estimated_duration?: string;
    progress?: number;
    totalModules?: number;
    completedModules?: number;
    status: string;
  };
  onStart?: () => void;
  onContinue?: () => void;
  onView?: () => void;
  className?: string;
}

export const ResponsiveCourseCard: React.FC<ResponsiveCourseCardProps> = ({
  course,
  onStart,
  onContinue,
  onView,
  className
}) => {
  const { isMobile, isTablet } = useBreakpoint();
  const { truncate } = useTruncateContent(isMobile ? 60 : 120);

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const hasProgress = course.progress !== undefined && course.progress > 0;
  const isCompleted = course.progress === 100;

  return (
    <Card className={cn(
      'group transition-all duration-200 hover:shadow-md',
      isMobile && 'rounded-lg border-0 shadow-sm',
      !isMobile && 'hover:-translate-y-1 hover:shadow-lg',
      className
    )}>
      <CardHeader className={cn(
        'space-y-3',
        isMobile && 'px-4 py-3',
        isTablet && 'px-5 py-4',
        !isMobile && 'px-6 py-5'
      )}>
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className={cn(
              'line-clamp-2 leading-tight',
              isMobile && 'text-base',
              isTablet && 'text-lg',
              !isMobile && 'text-xl'
            )}>
              {course.title}
            </CardTitle>
          </div>
          {!isMobile && (
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Description */}
        {course.description && (
          <CardDescription className={cn(
            isMobile && 'text-xs line-clamp-2',
            isTablet && 'text-sm line-clamp-3',
            !isMobile && 'text-sm line-clamp-3'
          )}>
            {truncate(course.description)}
          </CardDescription>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              getDifficultyColor(course.difficulty_level),
              isMobile && 'text-xs px-2 py-1',
              'font-medium'
            )}
          >
            {course.difficulty_level}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              isMobile && 'text-xs px-2 py-1'
            )}
          >
            {course.skill_area}
          </Badge>
          {isCompleted && (
            <Badge className={cn(
              'bg-green-100 text-green-800 border-green-200',
              isMobile && 'text-xs px-2 py-1'
            )}>
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn(
        'space-y-4',
        isMobile && 'px-4 pb-4',
        isTablet && 'px-5 pb-5',
        !isMobile && 'px-6 pb-6'
      )}>
        {/* Progress section */}
        {hasProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={cn(
                'font-medium',
                isMobile && 'text-sm',
                'text-foreground'
              )}>
                Progress
              </span>
              <span className={cn(
                'font-semibold',
                isMobile && 'text-sm',
                'text-primary'
              )}>
                {Math.round(course.progress || 0)}%
              </span>
            </div>
            <Progress value={course.progress || 0} className="h-2" />
            {course.completedModules !== undefined && course.totalModules !== undefined && (
              <p className={cn(
                'text-muted-foreground',
                isMobile && 'text-xs',
                !isMobile && 'text-sm'
              )}>
                {course.completedModules} of {course.totalModules} modules completed
              </p>
            )}
          </div>
        )}

        {/* Course info */}
        <div className={cn(
          'flex items-center gap-4',
          isMobile && 'gap-3'
        )}>
          {course.estimated_duration && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className={cn(
                isMobile && 'h-3 w-3',
                !isMobile && 'h-4 w-4'
              )} />
              <span className={cn(
                isMobile && 'text-xs',
                !isMobile && 'text-sm'
              )}>
                {course.estimated_duration}
              </span>
            </div>
          )}
          {course.totalModules && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className={cn(
                isMobile && 'h-3 w-3',
                !isMobile && 'h-4 w-4'
              )} />
              <span className={cn(
                isMobile && 'text-xs',
                !isMobile && 'text-sm'
              )}>
                {course.totalModules} modules
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={cn(
          'flex gap-2',
          isMobile && 'flex-col',
          !isMobile && 'flex-row'
        )}>
          {isCompleted ? (
            <Button 
              onClick={onView}
              variant="outline"
              className={cn(
                'flex-1',
                isMobile && 'h-9 text-sm'
              )}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Review Course
            </Button>
          ) : hasProgress ? (
            <Button 
              onClick={onContinue}
              className={cn(
                'flex-1',
                isMobile && 'h-9 text-sm'
              )}
            >
              <Play className="h-4 w-4 mr-2" />
              Continue Learning
            </Button>
          ) : (
            <Button 
              onClick={onStart}
              className={cn(
                'flex-1',
                isMobile && 'h-9 text-sm'
              )}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Course
            </Button>
          )}
          {!isMobile && (
            <Button 
              onClick={onView}
              variant="outline"
              size="sm"
            >
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};