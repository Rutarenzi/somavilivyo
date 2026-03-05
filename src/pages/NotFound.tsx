
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PageIntro } from "@/components/layout/PageIntro"; // Added
import { EnhancedButton } from "@/components/ui/enhanced-button"; // Added
import { Home } from "lucide-react"; // Added

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    // This page does not use AppLayout, so it needs its own full background and particles.
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-100 particles p-6">
      <PageIntro
        title="404 - Page Not Found"
        description="Oops! The page you're looking for doesn't exist or has been moved."
        cardClassName="max-w-xl w-full text-center"
        titleClassName="text-4xl md:text-5xl"
        descriptionClassName="text-lg"
      >
        <EnhancedButton asChild variant="gradient" size="lg" className="mt-6">
          <Link to="/">
            <Home className="mr-2 h-5 w-5" />
            Return to Home
          </Link>
        </EnhancedButton>
      </PageIntro>
      <p className="text-xs text-gray-500 mt-8 font-inter">
        Attempted path: <code className="bg-gray-200 text-gray-700 p-1 rounded">{location.pathname}</code>
      </p>
    </div>
  );
};

export default NotFound;

