import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, useResponsivePadding, useResponsiveSpacing } from '@/utils/responsiveUtils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
  spacing?: boolean;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'xl',
  padding = true,
  spacing = true,
  className
}) => {
  const { isMobile } = useBreakpoint();
  const responsivePadding = useResponsivePadding();
  const responsiveSpacing = useResponsiveSpacing();
  
  const getMaxWidth = (): string => {
    const maxWidthClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full'
    };
    
    return maxWidthClasses[maxWidth];
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      getMaxWidth(),
      padding && responsivePadding,
      spacing && responsiveSpacing,
      isMobile && 'px-4', // Ensure minimum padding on mobile
      className
    )}>
      {children}
    </div>
  );
};