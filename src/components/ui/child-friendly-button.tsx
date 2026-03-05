
import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ChildFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

export function ChildFriendlyButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  disabled = false,
  className
}: ChildFriendlyButtonProps) {
  const baseClasses = "font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 border-2 touch-manipulation";
  
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white border-blue-600 hover:border-blue-700",
    secondary: "bg-green-500 hover:bg-green-600 text-white border-green-600 hover:border-green-700",
    success: "bg-yellow-400 hover:bg-yellow-500 text-gray-800 border-yellow-500 hover:border-yellow-600",
    warning: "bg-orange-500 hover:bg-orange-600 text-white border-orange-600 hover:border-orange-700"
  };

  const sizeClasses = {
    small: "px-3 py-2 xs:px-4 xs:py-2 text-xs xs:text-sm min-h-[2.25rem] xs:min-h-[2.5rem]",
    medium: "px-4 py-2.5 xs:px-6 xs:py-3 text-sm xs:text-base min-h-[2.75rem] xs:min-h-[3rem]",
    large: "px-6 py-3 xs:px-8 xs:py-4 text-base xs:text-lg min-h-[3.25rem] xs:min-h-[3.5rem]"
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed transform-none hover:scale-100",
        className
      )}
    >
      <div className="flex items-center justify-center space-x-1 xs:space-x-2">
        {Icon && <Icon className="h-4 w-4 xs:h-5 w-5 flex-shrink-0" />}
        <span className="truncate">{children}</span>
      </div>
    </Button>
  );
}
