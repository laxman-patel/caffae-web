
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { hasValidSupabaseCredentials } from "./lib/supabase";
import Index from "./pages/Index";
import VideoCall from "./pages/VideoCall";
import NotFound from "./pages/NotFound";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

const queryClient = new QueryClient();

const App = () => {
  // We've hardcoded the credentials, so we'll always consider them valid
  const hasCredentials = true;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!hasCredentials && (
            <Alert className="m-4 border-yellow-500 bg-yellow-50">
              <AlertTitle className="text-yellow-800">Missing Supabase Credentials</AlertTitle>
              <AlertDescription className="text-yellow-700">
                You need to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.
                <br />
                Please check the Supabase documentation for more information.
              </AlertDescription>
            </Alert>
          )}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/video-call" element={<VideoCall />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
