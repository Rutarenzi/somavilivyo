
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { subscriptionManager } from "@/utils/subscriptionManager";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import CourseViewPage from "./pages/CourseViewPage";
import CourseLearningPage from "./pages/CourseLearningPage";
import CreateCoursePage from "./pages/CreateCoursePage";
import UpdateCoursePage from "./pages/UpdateCoursePage";
import { CourseGenerationProgressPage } from "./pages/CourseGenerationProgressPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AIChatPage from "./pages/AIChatPage";
import QuestionLibraryPage from "./pages/QuestionLibraryPage";
import HelpSupportPage from "./pages/HelpSupportPage"; 
import AboutPage from "./pages/AboutPage"; 
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage"; 
import WaitlistPage from "./pages/WaitlistPage";
import CurriculumAdminPage from "./pages/CurriculumAdminPage";
import NotFound from "./pages/NotFound";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/components/LandingPage";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import StudentProgressPage from "@/pages/StudentProgressPage";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { MovableBackgroundJobMonitor } from '@/components/generation/MovableBackgroundJobMonitor';
import { CourseGenerationProgressModal } from '@/components/course/CourseGenerationProgressModal';

const queryClient = new QueryClient();

const App = () => {
  // Cleanup all subscriptions when app unmounts
  useEffect(() => {
    return () => {
      console.log('App unmounting, cleaning up subscriptions...');
      subscriptionManager.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const [progressSessionId, setProgressSessionId] = useState<string | null>(null);

  const handleShowProgress = (sessionId: string) => {
    setProgressSessionId(sessionId);
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return <LandingPage onStartLearning={() => {}} />;
    }

    return <AppLayout>{children}</AppLayout>;
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallPrompt />
      <MovableBackgroundJobMonitor onShowProgress={handleShowProgress} />
      <CourseGenerationProgressModal 
        sessionId={progressSessionId}
        isOpen={!!progressSessionId}
        onClose={() => setProgressSessionId(null)}
      />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <CourseViewPage />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/edit" element={
          <ProtectedRoute>
            <UpdateCoursePage />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/learn" element={
          <ProtectedRoute>
            <CourseLearningPage />
          </ProtectedRoute>
        } />
        <Route path="/create-course" element={
          <ProtectedRoute>
            <CreateCoursePage />
          </ProtectedRoute>
        } />
        <Route path="/course-generation-progress/:sessionId" element={
          <ProtectedRoute>
            <CourseGenerationProgressPage />
          </ProtectedRoute>
        } />
        <Route path="/ai-chat" element={
          <ProtectedRoute>
            <AIChatPage />
          </ProtectedRoute>
        } />
        <Route path="/question-library" element={
          <ProtectedRoute>
            <QuestionLibraryPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/help" element={
          <ProtectedRoute>
            <HelpSupportPage />
          </ProtectedRoute>
        } />
        <Route path="/about" element={
          <ProtectedRoute>
            <AboutPage />
          </ProtectedRoute>
        } />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/waitlist" element={<WaitlistPage />} />
        <Route path="/curriculum-admin" element={
          <ProtectedRoute>
            <CurriculumAdminPage />
          </ProtectedRoute>
        } />
        <Route path="/courses/:courseId/progress" element={<StudentProgressPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
};

export default App;
