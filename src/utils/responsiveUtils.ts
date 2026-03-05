import { useEffect, useState } from 'react';

export interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export const breakpoints: BreakpointConfig = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export type BreakpointKey = keyof BreakpointConfig;

export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('md');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl');
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl');
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg');
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md');
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm');
      } else {
        setCurrentBreakpoint('xs');
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isXs = windowWidth < breakpoints.sm;
  const isSm = windowWidth >= breakpoints.sm && windowWidth < breakpoints.md;
  const isMd = windowWidth >= breakpoints.md && windowWidth < breakpoints.lg;
  const isLg = windowWidth >= breakpoints.lg && windowWidth < breakpoints.xl;
  const isXl = windowWidth >= breakpoints.xl && windowWidth < breakpoints['2xl'];
  const is2Xl = windowWidth >= breakpoints['2xl'];

  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl || is2Xl;

  return {
    currentBreakpoint,
    windowWidth,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: currentBreakpoint
  };
};

export const getResponsiveValue = <T>(
  values: Partial<Record<BreakpointKey, T>>,
  currentBreakpoint: BreakpointKey,
  fallback: T
): T => {
  // Define breakpoint order from largest to smallest
  const breakpointOrder: BreakpointKey[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  // Look for values starting from current breakpoint down to smaller ones
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp]!;
    }
  }
  
  return fallback;
};

export const useResponsiveColumns = (
  defaultColumns: Partial<Record<BreakpointKey, number>> = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  }
) => {
  const { currentBreakpoint } = useBreakpoint();
  return getResponsiveValue(defaultColumns, currentBreakpoint, 3);
};

export const useResponsiveSpacing = (
  spacing: Partial<Record<BreakpointKey, string>> = {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-10'
  }
) => {
  const { currentBreakpoint } = useBreakpoint();
  return getResponsiveValue(spacing, currentBreakpoint, 'space-y-4');
};

export const useResponsivePadding = (
  padding: Partial<Record<BreakpointKey, string>> = {
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
    '2xl': 'p-10'
  }
) => {
  const { currentBreakpoint } = useBreakpoint();
  return getResponsiveValue(padding, currentBreakpoint, 'p-4');
};

export const getResponsiveGridCols = (breakpoint: BreakpointKey): string => {
  const gridClasses: Record<BreakpointKey, string> = {
    xs: 'grid-cols-1',
    sm: 'grid-cols-2',
    md: 'grid-cols-3',
    lg: 'grid-cols-4',
    xl: 'grid-cols-5',
    '2xl': 'grid-cols-6'
  };
  
  return gridClasses[breakpoint];
};

export const getResponsiveTextSize = (breakpoint: BreakpointKey): string => {
  const textSizes: Record<BreakpointKey, string> = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };
  
  return textSizes[breakpoint];
};

// Utility to check if content should be truncated on mobile
export const useTruncateContent = (maxLength: number = 100) => {
  const { isMobile } = useBreakpoint();
  
  const truncate = (text: string): string => {
    if (!isMobile || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return { truncate, shouldTruncate: isMobile };
};

// Hook for responsive modal/dialog behavior
export const useResponsiveModal = () => {
  const { isMobile, isTablet } = useBreakpoint();
  
  return {
    modalClassName: isMobile 
      ? 'w-full h-full max-w-none max-h-none rounded-none' 
      : isTablet 
        ? 'w-full max-w-2xl max-h-[90vh]'
        : 'max-w-4xl max-h-[85vh]',
    shouldFullscreen: isMobile,
    contentPadding: isMobile ? 'p-4' : 'p-6'
  };
};