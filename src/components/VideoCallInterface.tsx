import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Search,
  RotateCw,
  User,
  Users,
} from "lucide-react"; // Added User, Users
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
    toggleMic,
    // Add state for remote user's mic/camera if provided by your context
    // remoteUserMicOn, remoteUserCameraOn
  } = useChat();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFindingPartner, setIsFindingPartner] = useState(false);

  // --- Hooks for setting up streams (no changes needed) ---
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // --- Hooks for toasts and initial connect/cleanup (no major changes needed) ---
  useEffect(() => {
    if (isConnected) {
      setIsFindingPartner(false);
      toast({
        title: "🎉 Connected!",
        description: "Say hi to your new chat partner!",
        // className: "bg-green-600 border-green-700 text-white", // Optional custom style
      });
    }
  }, [isConnected, toast]);

  useEffect(() => {
    if (otherUserDisconnected) {
      setIsFindingPartner(false);
      toast({
        title: "👋 Partner Disconnected",
        description: "They left the chat. Find someone new?",
        variant: "destructive",
      });
    }
  }, [otherUserDisconnected, toast]);

  useEffect(() => {
    return () => {
      if (isConnected || isConnecting) {
        disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- Action Handlers (no changes needed) ---
  const handleStartCall = async () => {
    if (isInitializing || isConnecting) return;
    try {
      setIsInitializing(true);
      await connect();
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Connection Error",
        description: "Couldn't start the call.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFindNewPartner = async () => {
    if (isFindingPartner || isConnecting) return;
    setIsFindingPartner(true);
    try {
      await findNewPartner();
    } catch (error) {
      console.error("Error finding new partner:", error);
      toast({
        title: "Error",
        description: "Couldn't find a new partner.",
        variant: "destructive",
      });
      setIsFindingPartner(false);
    }
  };

  const handleEndCall = () => {
    disconnect();
    setIsFindingPartner(false);
  };

  const showConnectingState =
    isConnecting || isInitializing || isFindingPartner;

  return (
    // --- Main container matching Index page style ---
    <div className="flex flex-col h-full bg-gradient-to-br w-full from-indigo-950 via-gray-900 to-black text-gray-100 relative overflow-hidden ">
      {/* --- Header matching Index page style --- */}
      <div className="flex items-center justify-between w-full border-b border-gray-700/50 flex-shrink-0">
        <div className=" flex items-center space-x-2">
          <Video className="h-5 w-5 text-pink-400" />
          <span className="font-semibold text-gray-200">Random Video Call</span>
        </div>
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          {isConnected && (
            <>
              {" "}
              <span className="text-xs font-medium text-green-400 mr-1">
                Connected
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-sm shadow-green-400/30"></div>{" "}
            </>
          )}
          {showConnectingState && !isConnected && (
            <>
              {" "}
              <span className="text-xs font-medium text-yellow-400 mr-1">
                Connecting...
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse shadow-sm shadow-yellow-400/30"></div>{" "}
            </>
          )}
          {!isConnected && !showConnectingState && (
            <>
              {" "}
              <span className="text-xs font-medium text-red-400 mr-1">
                Offline
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-sm shadow-red-400/30"></div>{" "}
            </>
          )}
        </div>
      </div>
      {/* --- Video Call Area (Main Content) --- */}
      {/* Make this parent relative to position overlays and controls within it */}
      <div className="flex-1 h-screen p-10 sm:p-4 flex flex-col relative overflow-hidden">
        {/* --- State Overlays (Connecting, Disconnected, Initial) - No layout changes needed here --- */}
        {showConnectingState && !isConnected && (
          <div className="absolute  inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-900/60 backdrop-blur-sm z-30">
            <RotateCw className="h-16 w-16 text-purple-400 animate-spin-slow" />
            <p className="text-lg  font-semibold text-gray-200 animate-pulse">
              {isFindingPartner ? "Finding Next Partner..." : "Connecting..."}
            </p>
            <p className="text-sm text-gray-400">
              Hold tight, this might take a moment!
            </p>
          </div>
        )}

        {otherUserDisconnected && !isConnected && !showConnectingState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-gray-900/60 backdrop-blur-sm z-30">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center mb-1">
              <VideoOff className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-lg font-semibold text-gray-200">
              Partner Disconnected
            </p>
            <p className="text-sm text-gray-400">
              Looks like they left the chat.
            </p>
            {/* Teal/Blue Gradient Button */}
            <Button
              size="lg"
              className="text-base font-semibold text-white rounded-full px-8 py-3 mt-2 justify-center bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
              onClick={handleFindNewPartner}
              disabled={isFindingPartner || isConnecting}
            >
              <Search className="mr-2 h-5 w-5" />{" "}
              {isFindingPartner ? "Searching..." : "Find New Partner"}
            </Button>
          </div>
        )}

        {!isConnected && !showConnectingState && !otherUserDisconnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-gray-900/60 backdrop-blur-sm z-30">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-1">
              {" "}
              <Video className="h-8 w-8 text-pink-400" />{" "}
            </div>
            <p className="text-lg font-semibold text-gray-200">
              Ready to Connect?
            </p>
            <p className="text-sm text-gray-400 text-center px-4">
              Tap below to start a random video call!
            </p>
            {/* Pink/Orange Gradient Button */}
            <Button
              size="lg"
              className="text-base font-semibold text-white rounded-full px-8 py-3 mt-2 justify-center bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
              onClick={handleStartCall}
              disabled={isInitializing || isConnecting}
            >
              <Video className="mr-2 h-5 w-5" />{" "}
              {isInitializing ? "Starting..." : "Start Random Call"}
            </Button>
          </div>
        )}

        {/* --- Connected State Video Layout --- */}
        {/* This container handles the layout switch */}
        <div
          className={`flex-1 flex w-full h-full gap-2 sm:gap-4 ${
            isConnected ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300
                       flex-col md:flex-row`}
        >
          {" "}
          {/* Mobile: Column, Desktop: Row */}
          {/* Local Video Container */}
          <div className="w-full md:flex-1 h-1/2 md:h-full bg-black rounded-2xl overflow-hidden relative shadow-lg">
            {/* Video Element */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Label */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
              <User size={12} /> You
            </div>
            {/* Camera Off Overlay */}
            {!isCameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                <VideoOff className="h-10 w-10 text-red-400" />
              </div>
            )}
            {/* Mic Off Indicator */}
            {!isMicOn && (
              <div className="absolute bottom-2 right-2 p-1.5 bg-red-600/80 rounded-full z-10 shadow-md">
                <MicOff className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          {/* Remote Video Container */}
          <div className="w-full md:flex-1 h-1/2 md:h-full bg-black rounded-2xl overflow-hidden relative shadow-lg">
            {/* Video Element */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Label */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
              <Users size={12} /> Partner
            </div>
            {/* Placeholder/Overlay if remote stream exists but isn't playing or if remote cam is off (if state available) */}
            {(!remoteStream ||
              remoteStream.getVideoTracks().length ===
                0) /* || !remoteUserCameraOn */ && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                {/* You could show a placeholder avatar or icon here */}
                <Users className="h-16 w-16 text-gray-600" />
              </div>
            )}
            {/* Add indicator for remote user mic off if state is available */}
            {/* {!remoteUserMicOn && remoteStream && (
                     <div className="absolute bottom-2 right-2 p-1.5 bg-red-600/80 rounded-full z-10 shadow-md">
                         <MicOff className="h-4 w-4 text-white" />
                     </div>
                  )} */}
          </div>
        </div>

        {/* --- Controls Bar (Positioned absolutely relative to the parent) --- */}
        {isConnected && (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 sm:space-x-4
                           bg-gray-900/70 backdrop-blur-lg p-3 rounded-full shadow-xl z-20"
          >
            {/* Mic Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200 text-white ${
                isMicOn
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-red-600/80 hover:bg-red-700/90"
              }`}
              onClick={toggleMic}
            >
              {isMicOn ? (
                <Mic
                  size={20} // Base size (maps to 1.25rem or 20px)
                  className="sm:w-6 sm:h-6" // Override on sm+: w/h-6 maps to 1.5rem or 24px
                />
              ) : (
                <MicOff size={20} className="sm:w-6 sm:h-6" />
              )}
            </Button>

            {/* End Call Button */}
            <Button
              variant="destructive"
              size="icon"
              className="rounded-full h-16 w-16 sm:h-20 sm:w-20 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 transition-all duration-300 transform hover:scale-105"
              onClick={handleEndCall}
            >
              <Phone
                size={24} // Base size (1.5rem or 24px)
                className="rotate-[135deg] sm:w-7 sm:h-7" // Override on sm+: w/h-7 maps to 1.75rem or 28px
              />
            </Button>

            {/* Camera Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200 text-white ${
                isCameraOn
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-red-600/80 hover:bg-red-700/90"
              }`}
              onClick={toggleCamera}
            >
              {isCameraOn ? (
                <Video size={20} className="sm:w-6 sm:h-6" />
              ) : (
                <VideoOff size={20} className="sm:w-6 sm:h-6" />
              )}
            </Button>
          </div>
        )}
      </div>{" "}
      {/* End Video Call Area */}
    </div> // End Main Container
  );
};
