
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface EnhancedProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
  variant?: "default" | "gradient" | "glow"
  showPercentage?: boolean
}

const EnhancedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  EnhancedProgressProps
>(({ className, value = 0, variant = "default", showPercentage = false, ...props }, ref) => {
  const [animatedValue, setAnimatedValue] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const getIndicatorClass = () => {
    switch (variant) {
      case "gradient":
        return "gradient-primary shadow-glow";
      case "glow":
        return "bg-indigo-500 shadow-glow animate-pulse-glow";
      default:
        return "bg-primary";
    }
  };

  return (
    <div className="space-y-2">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-3 w-full overflow-hidden rounded-full bg-secondary shadow-inner",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-1000 ease-out",
            getIndicatorClass()
          )}
          style={{ transform: `translateX(-${100 - (animatedValue || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showPercentage && (
        <div className="text-right text-sm text-muted-foreground font-medium">
          {Math.round(animatedValue || 0)}%
        </div>
      )}
    </div>
  )
})
EnhancedProgress.displayName = "EnhancedProgress"

export { EnhancedProgress }
