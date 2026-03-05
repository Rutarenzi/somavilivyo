import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, Home, BookOpen, User, Settings, MessageSquare, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreakpoint } from '@/utils/responsiveUtils';

interface MobileOptimizedLayoutProps {
  children?: React.ReactNode;
}

const navigationItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard', active: false },
  { icon: BookOpen, label: 'My Courses', href: '/courses', active: true },
  { icon: MessageSquare, label: 'AI Chat', href: '/ai-chat', active: false },
  { icon: User, label: 'Profile', href: '/profile', active: false },
  { icon: Settings, label: 'Settings', href: '/settings', active: false },
  { icon: HelpCircle, label: 'Help & Support', href: '/help', active: false },
];

export const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  if (!isMobile && !isTablet) {
    return <>{children || <Outlet />}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Mobile Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="px-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="text-lg font-semibold">
                  Somavilivyo
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4 space-y-1">
                {navigationItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      item.active 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold text-lg">My Courses</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="px-2">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          {children || <Outlet />}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-around px-2 py-2">
            {navigationItems.slice(0, 4).map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0',
                  item.active 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
};