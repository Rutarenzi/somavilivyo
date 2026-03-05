
import { cn } from "@/lib/utils"

interface SkeletonLoaderProps {
  className?: string
  variant?: "card" | "text" | "avatar" | "button"
  animate?: boolean
}

export const SkeletonLoader = ({ 
  className, 
  variant = "card", 
  animate = true 
}: SkeletonLoaderProps) => {
  const getVariantClass = () => {
    switch (variant) {
      case "text":
        return "h-4 w-full rounded";
      case "avatar":
        return "h-12 w-12 rounded-full";
      case "button":
        return "h-10 w-24 rounded-md";
      default:
        return "h-32 w-full rounded-lg";
    }
  };

  return (
    <div
      className={cn(
        "bg-gray-200",
        animate && "loading-shimmer",
        getVariantClass(),
        className
      )}
    />
  );
};

export const SkeletonCardGrid = ({ count = 3 }: { count?: number }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-4 p-6 border rounded-2xl">
        <SkeletonLoader variant="avatar" />
        <SkeletonLoader variant="text" />
        <SkeletonLoader variant="text" className="w-3/4" />
        <SkeletonLoader variant="button" />
      </div>
    ))}
  </div>
);
