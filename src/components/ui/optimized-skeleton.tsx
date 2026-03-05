import React from "react";
import { cn } from "@/lib/utils";

interface OptimizedSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  animation?: "pulse" | "wave" | "none";
  width?: string | number;
  height?: string | number;
}

const OptimizedSkeleton = React.memo<OptimizedSkeletonProps>(({ 
  className, 
  variant = "rectangular",
  animation = "pulse",
  width,
  height,
  ...props 
}) => {
  const baseClasses = "bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
    card: "rounded-lg"
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-gradient-shift bg-size-200",
    none: ""
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      {...props}
    />
  );
});

OptimizedSkeleton.displayName = "OptimizedSkeleton";

export { OptimizedSkeleton };