import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/utils/responsiveUtils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AdaptiveLoadingProps {
  variant?: 'cards' | 'list' | 'table' | 'content' | 'dashboard';
  count?: number;
  className?: string;
}

export const AdaptiveLoading: React.FC<AdaptiveLoadingProps> = ({
  variant = 'cards',
  count = 3,
  className
}) => {
  const { isMobile, isTablet } = useBreakpoint();

  const CardsSkeleton = () => (
    <div className={cn(
      'grid gap-4',
      isMobile && 'grid-cols-1',
      isTablet && 'grid-cols-2',
      !isMobile && !isTablet && 'grid-cols-3'
    )}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader className={cn(
            'space-y-3',
            isMobile && 'p-4',
            !isMobile && 'p-6'
          )}>
            <Skeleton className={cn(
              'h-4',
              isMobile && 'w-3/4',
              !isMobile && 'w-2/3'
            )} />
            <Skeleton className={cn(
              'h-3',
              isMobile && 'w-full',
              !isMobile && 'w-4/5'
            )} />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent className={cn(
            'space-y-3',
            isMobile && 'px-4 pb-4',
            !isMobile && 'px-6 pb-6'
          )}>
            <Skeleton className="h-2 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className={cn(
              'h-8',
              isMobile && 'w-full',
              !isMobile && 'w-24'
            )} />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={cn(
          'flex items-center gap-4 p-4 rounded-lg border',
          isMobile && 'p-3'
        )}>
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className={cn(
              'h-4',
              isMobile && 'w-3/4',
              !isMobile && 'w-1/3'
            )} />
            <Skeleton className={cn(
              'h-3',
              isMobile && 'w-full',
              !isMobile && 'w-1/2'
            )} />
          </div>
          {!isMobile && <Skeleton className="h-8 w-20" />}
        </div>
      ))}
    </div>
  );

  const TableSkeleton = () => {
    if (isMobile) {
      return <ListSkeleton />;
    }

    return (
      <div className="rounded-md border">
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="p-4 border-b last:border-b-0">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ContentSkeleton = () => (
    <Card>
      <CardHeader className={cn(
        isMobile && 'p-4',
        !isMobile && 'p-6'
      )}>
        <Skeleton className={cn(
          'h-6',
          isMobile && 'w-3/4',
          !isMobile && 'w-1/3'
        )} />
        <Skeleton className={cn(
          'h-4',
          isMobile && 'w-full',
          !isMobile && 'w-2/3'
        )} />
      </CardHeader>
      <CardContent className={cn(
        'space-y-4',
        isMobile && 'px-4 pb-4',
        !isMobile && 'px-6 pb-6'
      )}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );

  const DashboardSkeleton = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className={cn(
        'grid gap-4',
        isMobile && 'grid-cols-2',
        isTablet && 'grid-cols-3',
        !isMobile && !isTablet && 'grid-cols-4'
      )}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className={cn(
              'p-4',
              isMobile && 'p-3'
            )}>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className={cn(
                  'h-6',
                  isMobile && 'w-16',
                  !isMobile && 'w-12'
                )} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className={cn(
        'grid gap-6',
        isMobile && 'grid-cols-1',
        !isMobile && 'grid-cols-2'
      )}>
        <ContentSkeleton />
        <ContentSkeleton />
      </div>
    </div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'cards':
        return <CardsSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'table':
        return <TableSkeleton />;
      case 'content':
        return <ContentSkeleton />;
      case 'dashboard':
        return <DashboardSkeleton />;
      default:
        return <CardsSkeleton />;
    }
  };

  return (
    <div className={cn('animate-pulse', className)}>
      {renderSkeleton()}
    </div>
  );
};