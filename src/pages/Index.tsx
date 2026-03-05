
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import { Loader2 } from "lucide-react"; // Added

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      // Consistent loading screen background (does not use AppLayout at this stage)
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 particles flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-xl text-gray-700 font-inter">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return <LandingPage onStartLearning={() => navigate('/dashboard')} />;
};

export default Index;

