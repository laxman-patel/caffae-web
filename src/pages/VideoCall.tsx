
import { Navbar } from "@/components/Navbar";
import { VideoCallInterface } from "@/components/VideoCallInterface";
import { ChatProvider } from "@/context/ChatContext";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const VideoCall = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 pt-16 flex flex-col">
        <div className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col border border-border rounded-xl my-6 shadow-subtle bg-background">
          <ChatProvider>
            <VideoCallInterface />
          </ChatProvider>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
