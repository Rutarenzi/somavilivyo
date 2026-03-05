import React from 'react';
import { cn } from '@/lib/utils';
import { FloatingCard } from '@/components/ui/floating-card';
interface PageIntroProps {
  title: string;
  description?: string;
  icon?: React.ReactNode; // Added icon prop
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  cardClassName?: string;
  children?: React.ReactNode; // For actions or breadcrumbs below description
}
export const PageIntro: React.FC<PageIntroProps> = ({
  title,
  description,
  icon,
  // Destructured icon prop
  className,
  titleClassName,
  descriptionClassName,
  cardClassName,
  children
}) => {
  return <FloatingCard variant="glass" className={cn("p-6 md:p-8 mb-8 shadow-large border-white/50 animate-fade-in", cardClassName)}>
      <div className={cn(className)}>
        <div className="flex items-center gap-4 mb-3"> {/* Container for icon and title */}
          {icon && <div className="flex-shrink-0">{icon}</div>} {/* Render icon */}
          
        </div>
        {description && <p className={cn("text-lg md:text-xl text-gray-600 font-inter", descriptionClassName)}>
            {description}
          </p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </FloatingCard>;
};