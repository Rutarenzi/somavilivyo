import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle, 
  Circle, 
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/utils/responsiveUtils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface ModuleData {
  id: string;
  title: string;
  content: string;
  learning_objective: string;
  estimated_duration_minutes: number;
  topic_index: number;
  subtopic_index: number;
  module_index: number;
  completed?: boolean;
}

interface ResponsiveModuleViewProps {
  modules: ModuleData[];
  currentModuleIndex: number;
  onModuleChange: (index: number) => void;
  onComplete?: (moduleId: string) => void;
  courseTitle?: string;
  className?: string;
}

export const ResponsiveModuleView: React.FC<ResponsiveModuleViewProps> = ({
  modules,
  currentModuleIndex,
  onModuleChange,
  onComplete,
  courseTitle = "Course",
  className
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  const currentModule = modules[currentModuleIndex];

  if (!currentModule) return null;

  const completedModules = modules.filter(m => m.completed).length;
  const progressPercentage = (completedModules / modules.length) * 100;

  const ModuleNavigation = () => (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span>{completedModules} of {modules.length}</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <Separator />

      {/* Module List */}
      <ScrollArea className={cn(
        isMobile && 'h-60',
        isTablet && 'h-80',
        !isMobile && !isTablet && 'h-96'
      )}>
        <div className="space-y-2">
          {modules.map((module, index) => (
            <button
              key={module.id}
              onClick={() => {
                onModuleChange(index);
                if (isMobile) setSidebarOpen(false);
              }}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-all',
                index === currentModuleIndex 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                'group'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {module.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium line-clamp-2',
                    isMobile && 'text-sm',
                    index === currentModuleIndex && 'text-primary'
                  )}>
                    {module.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {module.estimated_duration_minutes} min
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{courseTitle}</h3>
                <p className="text-sm text-muted-foreground">Course Modules</p>
              </div>
              <ModuleNavigation />
            </SheetContent>
          </Sheet>
          <div className="flex-1 text-center">
            <Badge variant="outline" className="text-xs">
              {currentModuleIndex + 1} of {modules.length}
            </Badge>
          </div>
          <div className="w-8" /> {/* Spacer for balance */}
        </div>
      )}

      <div className={cn(
        'flex flex-1 gap-6',
        isMobile && 'flex-col gap-0'
      )}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className={cn(
            'flex-shrink-0 border-r bg-muted/30',
            isTablet && 'w-80',
            !isTablet && 'w-96'
          )}>
            <div className="p-6">
              <div className="space-y-2 mb-6">
                <h2 className="font-semibold text-lg">{courseTitle}</h2>
                <p className="text-sm text-muted-foreground">Course Modules</p>
              </div>
              <ModuleNavigation />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className={cn(
            'flex-1 overflow-y-auto',
            isMobile && 'px-4',
            !isMobile && 'pr-6 py-6'
          )}>
            <Card className="h-full">
              <CardHeader className={cn(
                'space-y-3',
                isMobile && 'px-4 py-4',
                'border-b'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className={cn(
                      'line-clamp-2',
                      isMobile && 'text-lg',
                      !isMobile && 'text-xl'
                    )}>
                      {currentModule.title}
                    </CardTitle>
                    <CardDescription className={cn(
                      'mt-2',
                      isMobile && 'text-sm'
                    )}>
                      {currentModule.learning_objective}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    {currentModule.estimated_duration_minutes} min
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className={cn(
                'flex-1',
                isMobile && 'px-4 py-4'
              )}>
                <div className={cn(
                  'prose prose-sm max-w-none',
                  isMobile && 'prose-xs',
                  'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground'
                )}>
                  <div dangerouslySetInnerHTML={{ __html: currentModule.content }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Controls */}
          <div className={cn(
            'border-t bg-background p-4',
            isMobile && 'sticky bottom-0'
          )}>
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => onModuleChange(currentModuleIndex - 1)}
                disabled={currentModuleIndex === 0}
                className={cn(
                  'flex-1',
                  isMobile && 'max-w-32'
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {!currentModule.completed && (
                  <Button
                    variant="secondary"
                    onClick={() => onComplete?.(currentModule.id)}
                    className={cn(
                      isMobile && 'px-3'
                    )}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                )}
              </div>

              <Button
                onClick={() => onModuleChange(currentModuleIndex + 1)}
                disabled={currentModuleIndex === modules.length - 1}
                className={cn(
                  'flex-1',
                  isMobile && 'max-w-32'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};