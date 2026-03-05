
import * as React from "react"
import { cn } from "@/lib/utils"

const FloatingCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "gradient" | "elevated"
    hover?: boolean
  }
>(({ className, variant = "default", hover = true, children, ...props }, ref) => {
  const getVariantClass = () => {
    switch (variant) {
      case "glass":
        return "glass bg-white/80 backdrop-blur-glass border border-white/50";
      case "gradient":
        return "gradient-primary text-white";
      case "elevated":
        return "bg-white shadow-large border-0";
      default:
        return "bg-card text-card-foreground border";
    }
  };

  // Ensure we have valid children
  if (!children) {
    console.warn("FloatingCard expects children")
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl shadow-soft transition-all duration-500 ease-out",
        getVariantClass(),
        hover && "hover:shadow-large hover:-translate-y-2 hover:scale-[1.02]",
        "animate-fade-in",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
FloatingCard.displayName = "FloatingCard"

export { FloatingCard }
