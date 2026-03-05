import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useBreakpoint, useTruncateContent } from '@/utils/responsiveUtils';

interface MobileOptimizedCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  truncateDescription?: boolean;
  maxDescriptionLength?: number;
  headerActions?: React.ReactNode;
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  title,
  description,
  children,
  className,
  truncateDescription = true,
  maxDescriptionLength = 80,
  headerActions
}) => {
  const { isMobile, isTablet } = useBreakpoint();
  const { truncate } = useTruncateContent(maxDescriptionLength);

  const displayDescription = description && truncateDescription 
    ? truncate(description) 
    : description;

  return (
    <Card className={cn(
      'w-full transition-all duration-200',
      isMobile && 'rounded-lg border-0 shadow-sm',
      isTablet && 'hover:shadow-md',
      !isMobile && 'hover:shadow-lg hover:-translate-y-1',
      className
    )}>
      <CardHeader className={cn(
        'space-y-2',
        isMobile && 'px-4 py-3',
        isTablet && 'px-5 py-4',
        !isMobile && 'px-6 py-5'
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className={cn(
              'line-clamp-2',
              isMobile && 'text-base leading-tight',
              isTablet && 'text-lg',
              !isMobile && 'text-xl'
            )}>
              {title}
            </CardTitle>
            {displayDescription && (
              <CardDescription className={cn(
                'mt-1',
                isMobile && 'text-xs line-clamp-2',
                isTablet && 'text-sm line-clamp-3',
                !isMobile && 'text-sm'
              )}>
                {displayDescription}
              </CardDescription>
            )}
          </div>
          {headerActions && (
            <div className={cn(
              'flex-shrink-0',
              isMobile && 'ml-2'
            )}>
              {headerActions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={cn(
        isMobile && 'px-4 pb-4',
        isTablet && 'px-5 pb-5',
        !isMobile && 'px-6 pb-6'
      )}>
        {children}
      </CardContent>
    </Card>
  );
};