import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Dashboard } from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Debug component for development
const AuthDebug = () => {
  const { user, userRole, loading } = useAuth();
  
  useEffect(() => {
    console.log('AuthDebug: State updated', { user: !!user, userRole, loading });
  }, [user, userRole, loading]);
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? user.email : 'null'}</div>
        <div>Role: {userRole || 'null'}</div>
        <div>Time: {new Date().toLocaleTimeString()}</div>
      </div>
    );
  }
  
  return null;
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [forceShow, setForceShow] = useState(false);
  const [showLoginFallback, setShowLoginFallback] = useState(false);

  useEffect(() => {
    console.log('AppContent: Loading state changed', { loading, user: !!user });
    
    // Force show content after 8 seconds to prevent getting stuck
    const forceTimeout = setTimeout(() => {
      console.warn('Force timeout - showing content regardless of loading state');
      setForceShow(true);
    }, 8000);

    // Show login fallback after 5 seconds if still loading
    const loginFallbackTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Login fallback timeout - showing login form');
        setShowLoginFallback(true);
      }
    }, 5000);

    const raiseAlert = setTimeout(() => {
      console.log('Raising alert');
      let n = Math.floor(Math.random() * 10)
      console.log(n)
      if (n%2==0) {
        console.warn('Raising alert');
        alert('This is a random alert!');
      } 
    }, 500);

    return () => {
      clearTimeout(forceTimeout);
      clearTimeout(loginFallbackTimeout);
      clearTimeout(raiseAlert);
    };
  }, [loading, user]);

  // Show content if loading is false OR if we've hit the force timeout
  const shouldShowContent = !loading || forceShow;

  if (!shouldShowContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
          <p className="mt-1 text-xs text-muted-foreground">Initializing authentication...</p>
          {forceShow && (
            <p className="mt-1 text-xs text-orange-500">Forced to show content</p>
          )}
          {showLoginFallback && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Taking too long? Try refreshing or check your connection.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs text-blue-500 hover:text-blue-700 underline"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthDebug />
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <AuthForm />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
