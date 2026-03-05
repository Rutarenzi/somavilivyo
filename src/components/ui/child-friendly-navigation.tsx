
import React from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { BookOpen, Trophy, Star, ArrowRight } from 'lucide-react';

interface NavigationItem {
  id: string;
  title: string;
  description: string;
  completed?: boolean;
  current?: boolean;
  locked?: boolean;
  stars?: number;
}

interface ChildFriendlyNavigationProps {
  items: NavigationItem[];
  onItemClick: (id: string) => void;
}

export function ChildFriendlyNavigation({ items, onItemClick }: ChildFriendlyNavigationProps) {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        🎓 Your Learning Journey
      </h2>
      
      <div className="grid gap-4">
        {items.map((item, index) => (
          <Card
            key={item.id}
            className={cn(
              "p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 border-2",
              item.current && "border-blue-500 bg-blue-50 shadow-lg",
              item.completed && "border-green-500 bg-green-50",
              item.locked && "opacity-50 cursor-not-allowed hover:scale-100",
              !item.current && !item.completed && !item.locked && "border-gray-200 hover:border-blue-300"
            )}
            onClick={() => !item.locked && onItemClick(item.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                  item.completed && "bg-green-500 text-white",
                  item.current && "bg-blue-500 text-white",
                  item.locked && "bg-gray-300 text-gray-500",
                  !item.current && !item.completed && !item.locked && "bg-yellow-400 text-gray-800"
                )}>
                  {item.completed ? '✓' : item.locked ? '🔒' : index + 1}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                  
                  {item.stars && item.stars > 0 && (
                    <div className="flex items-center mt-2">
                      {[...Array(item.stars)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {item.stars} star{item.stars !== 1 ? 's' : ''}!
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {item.completed && (
                  <Badge className="bg-green-500 text-white">
                    <Trophy className="h-3 w-3 mr-1" />
                    Done!
                  </Badge>
                )}
                {item.current && (
                  <Badge className="bg-blue-500 text-white">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Current
                  </Badge>
                )}
                {!item.locked && (
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
