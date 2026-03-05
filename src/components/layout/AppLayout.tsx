
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BackgroundJobMonitor } from "@/components/generation/BackgroundJobMonitor";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import somavilivyoLogo from "@/assets/somavilivyo-logo.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [showProgressInterface, setShowProgressInterface] = useState<string | null>(null);

  const handleShowProgress = (sessionId: string) => {
    // Navigate to a route that shows the progress interface with session data
    navigate(`/course-generation-progress/${sessionId}`);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 particles relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-10 xs:top-20 left-10 xs:left-20 w-36 h-36 xs:w-72 xs:h-72 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-2xl xs:blur-3xl animate-float"></div>
        <div className="absolute bottom-10 xs:bottom-20 right-10 xs:right-20 w-48 h-48 xs:w-96 xs:h-96 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl xs:blur-3xl animate-float" style={{animationDelay: "2s"}}></div>
        
        <AppSidebar />
        <SidebarInset className="flex-1 relative z-10 w-full">
          <header className="flex h-14 xs:h-16 shrink-0 items-center gap-2 xs:gap-4 border-b border-white/20 px-2 xs:px-3 sm:px-6 glass bg-white/80 backdrop-blur-glass shadow-soft sticky top-0 z-50">
            <SidebarTrigger className="-ml-1 hover:bg-white/50 rounded-lg transition-smooth hover:scale-105 p-1.5 xs:p-2" />
            <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3 min-w-0 flex-1">
              <img 
                src={somavilivyoLogo} 
                alt="SomaVilivyo Logo" 
                className="h-5 w-5 xs:h-6 xs:w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-base xs:text-lg sm:text-xl font-jakarta font-bold text-gradient bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  SomaVilivyo
                </h1>
                <div className="text-xs text-gray-500 font-medium hidden sm:block">AI-Powered Learning</div>
              </div>
            </div>
            
            {/* Status indicator and notification bell */}
            <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-3 flex-shrink-0">
              <NotificationBell />
              <div className="hidden lg:flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600 font-medium">All systems operational</span>
              </div>
            </div>
          </header>
          <main className="flex-1 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 min-h-[calc(100vh-3.5rem)] xs:min-h-[calc(100vh-4rem)] relative particles overflow-x-hidden w-full">
            {children}
          </main>
        </SidebarInset>
        
        {/* Background Job Monitor - floats over everything */}
        <BackgroundJobMonitor onShowProgress={handleShowProgress} />
      </div>
    </SidebarProvider>
  );
}
