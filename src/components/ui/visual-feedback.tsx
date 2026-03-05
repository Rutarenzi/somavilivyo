
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Star, Trophy } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  message: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ show, message, onComplete }: SuccessAnimationProps) {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl transform animate-bounce">
        <div className="text-6xl mb-4">🎉</div>
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Great Job!</h2>
        <p className="text-lg text-gray-600">{message}</p>
        <div className="flex justify-center mt-4 space-x-1">
          {[...Array(3)].map((_, i) => (
            <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ProgressCelebrationProps {
  level: number;
  show: boolean;
}

export function ProgressCelebration({ level, show }: ProgressCelebrationProps) {
  if (!show) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-xl text-center shadow-lg">
      <div className="flex items-center justify-center space-x-2">
        <Trophy className="h-8 w-8 text-white" />
        <span className="text-white font-bold text-xl">Level {level} Complete!</span>
        <Trophy className="h-8 w-8 text-white" />
      </div>
      <p className="text-white mt-2">You're doing amazing! Keep going! 🌟</p>
    </div>
  );
}

interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'fun' | 'exciting' | 'calm';
  disabled?: boolean;
}

export function InteractiveButton({ 
  children, 
  onClick, 
  variant = 'fun', 
  disabled = false 
}: InteractiveButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const variantClasses = {
    fun: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    exciting: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
    calm: "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "px-6 py-3 rounded-2xl text-white font-bold text-lg shadow-lg",
        "transform transition-all duration-150 hover:scale-105 active:scale-95",
        variantClasses[variant],
        isPressed && "scale-95",
        disabled && "opacity-50 cursor-not-allowed transform-none hover:scale-100"
      )}
    >
      {children}
    </button>
  );
}
