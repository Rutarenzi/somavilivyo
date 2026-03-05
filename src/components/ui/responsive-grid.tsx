import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, BreakpointKey } from '@/utils/responsiveUtils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: Partial<Record<BreakpointKey, number>>;
  gap?: Partial<Record<BreakpointKey, string>>;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  },
  gap = {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  },
  className
}) => {
  const { currentBreakpoint } = useBreakpoint();
  
  const getGridCols = (): string => {
    const cols = columns[currentBreakpoint] || columns.md || 3;
    return `grid-cols-${cols}`;
  };
  
  const getGap = (): string => {
    return gap[currentBreakpoint] || gap.md || 'gap-4';
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      getGap(),
      className
    )}>
      {children}
    </div>
  );
};