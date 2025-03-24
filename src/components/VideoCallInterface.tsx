import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Video, VideoOff, Mic, MicOff, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const VideoCallInterface = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    isConnecting, 
    isConnected, 
    otherUserDisconnected, 
    localStream,
    remoteStream,
    isCameraOn,
    isMicOn,
    connect, 
    disconnect, 
    findNewPartner,
    toggleCamera,
    toggleMic
  } = useChat();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  // Set up remote video stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle connection state changes
  useEffect(() => {
    if (isConnected) {
      toast({
        title: "Connected",
        description: "You are now connected with a stranger.",
      });
    }
  }, [isConnected, toast]);

  // Handle disconnection
  useEffect(() => {
    if (otherUserDisconnected) {
      toast({
        title: "Partner Disconnected",
        description: "Your video call partner has disconnected.",
        variant: "destructive",
      });
    }
  }, [otherUserDisconnected, toast]);
  
  // Connect to chat when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting && user && !isInitializing) {
      handleStartCall();
    }
    
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [user, isConnected, isConnecting, isInitializing]);
  
  const handleStartCall = async () => {
    try {
      setIsInitializing(true);
      await connect();
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: "Error",
        description: "Failed to start video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };
  
  const handleEndCall = () => {
    disconnect();
  };
  
  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Video className="h-5 w-5 text-primary" />
          <span className="font-medium">Random Video Call</span>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Connected</span>
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </div>
          )}
          {isConnecting && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Connecting</span>
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
            </div>
          )}
          {!isConnected && !isConnecting && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Disconnected</span>
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Video Call Area */}
      <div className="flex-1 p-4 flex flex-col relative">
        {isConnecting && (
          <div className="flex flex-col items-center justify-center h-full space-y-3 animate-pulse">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-10 w-10 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">Finding someone to video call with...</p>
          </div>
        )}
        
        {otherUserDisconnected && !isConnected && !isConnecting && (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <VideoOff className="h-10 w-10 text-destructive/50" />
            </div>
            <p className="text-sm text-muted-foreground">Your call partner disconnected.</p>
            <Button variant="default" size="sm" onClick={findNewPartner}>
              Find New Partner
            </Button>
          </div>
        )}
        
        {isConnected && (
          <div className="flex flex-col h-full relative">
            {/* Remote Video (fullscreen) */}
            <div className="w-full h-full bg-black rounded-lg overflow-hidden">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Local Video (picture-in-picture) */}
            <div className="absolute bottom-4 right-4 w-1/4 max-w-[200px] aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg border-2 border-background">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <VideoOff className="h-8 w-8 text-white/70" />
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-lg">
              <Button 
                variant={isMicOn ? "ghost" : "destructive"} 
                size="icon" 
                className="rounded-full h-12 w-12" 
                onClick={toggleMic}
              >
                {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
              </Button>
              
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full h-14 w-14" 
                onClick={handleEndCall}
              >
                <Phone size={24} className="rotate-135" />
              </Button>
              
              <Button 
                variant={isCameraOn ? "ghost" : "destructive"} 
                size="icon" 
                className="rounded-full h-12 w-12" 
                onClick={toggleCamera}
              >
                {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
              </Button>
            </div>
          </div>
        )}
        
        {!isConnected && !isConnecting && !otherUserDisconnected && (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-10 w-10 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">Start a random video call</p>
            <Button 
              variant="default" 
              onClick={handleStartCall}
              disabled={isInitializing}
            >
              {isInitializing ? "Initializing..." : "Start Call"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
