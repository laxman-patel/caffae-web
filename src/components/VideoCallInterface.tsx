import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  SetStateAction,
  Dispatch,
} from "react";
import { io, Socket } from "socket.io-client";
import WebRTCHandler from "../lib/webrtc"; // Adjust path - Needs the modified version

// --- Placeholder Imports (Replace with your actual library imports) ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Video,
  MessageSquareText,
  RotateCw,
  Users,
  VideoOff,
  Search,
  User,
  Mic,
  MicOff,
  Phone,
} from "lucide-react";

// --- Type Definitions ---
type SocketId = string;
type AppStatus =
  | "offline"
  | "connecting"
  | "idle"
  | "submitting"
  | "waiting"
  | "in_call"
  | "disconnected_peer";

interface MatchFoundPayload {
  peerId: SocketId;
  caller: boolean;
  peerInterests: string[];
}

interface UserDisconnectedPayload {
  peerId: SocketId;
}

// --- Constants ---
const SERVER_URL = "http://localhost:8088";

// --- Main Application Component ---
function VideoCallInterface() {
  // --- State Variables ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [appStatus, setAppStatus] = useState<AppStatus>("offline");
  const [userId, setUserId] = useState<SocketId | null>(null);
  const [peerId, setPeerId] = useState<SocketId | null>(null);
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [interestInput, setInterestInput] = useState<string>("");
  const [currentInterest, setCurrentInterest] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [peerInterests, setPeerInterests] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);

  // --- Refs ---
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  // Ref to track the current logical status immediately, avoiding state update delays for checks
  const statusRef = useRef<AppStatus>(appStatus);

  // --- Effect to keep statusRef synchronized with appStatus after renders ---
  useEffect(() => {
    statusRef.current = appStatus;
  }, [appStatus]);

  // --- Derived State ---
  const isConnected =
    socket?.connected === true &&
    appStatus !== "connecting" &&
    appStatus !== "offline";
  const isConnecting = appStatus === "connecting";
  const isWaitingForMatch = appStatus === "waiting";
  const isSubmitting = appStatus === "submitting";
  const isInCall = appStatus === "in_call";
  const otherUserDisconnected = appStatus === "disconnected_peer";
  const showLoadingState = isConnecting || isWaitingForMatch || isSubmitting;
  const canStartCall =
    isConnected &&
    interestInput.trim() !== "" &&
    !showLoadingState &&
    appStatus !== "in_call";

  // --- Helper to update state and ref simultaneously ---
  const updateStatus = (newStatus: AppStatus) => {
    console.log(`Status changing: ${statusRef.current} -> ${newStatus}`); // Log status changes
    statusRef.current = newStatus; // Update ref immediately
    setAppStatus(newStatus); // Update state
  };

  // --- Media Handling ---
  const startLocalStream = useCallback(async () => {
    console.log("Starting local stream...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });
      console.log("Local stream obtained.");
      setLocalStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error("Error starting local stream:", error);
      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError"
        ) {
          setErrorMessage(
            "Camera/Microphone access denied. Please enable permissions."
          );
        } else if (
          error.name === "NotFoundError" ||
          error.name === "DevicesNotFoundError"
        ) {
          setErrorMessage("No camera/microphone found.");
        } else {
          setErrorMessage(
            `Failed to start camera/microphone: ${error.message}`
          );
        }
      } else {
        setErrorMessage(
          "An unknown error occurred while accessing media devices."
        );
      }
      updateStatus("idle"); // Use helper
      return null;
    }
  }, []); // updateStatus is stable

  const stopLocalStream = useCallback(() => {
    console.log("Stopping local stream.");
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    setLocalStream(null);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setIsMicOn(false);
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        const newState = !track.enabled;
        track.enabled = newState;
        setIsMicOn(newState);
        console.log(`Microphone ${newState ? "ON" : "OFF"}`);
      });
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        const newState = !track.enabled;
        track.enabled = newState;
        setIsCameraOn(newState);
        console.log(`Camera ${newState ? "ON" : "OFF"}`);
      });
    }
  }, [localStream]);

  // --- Callbacks for WebRTCHandler ---
  const handleCallEstablished = useCallback(() => {
    console.log("Callback: Call established!");
  }, []);

  const handleCallEndedByWebRTC = useCallback(() => {
    console.log("Callback: Call ended by WebRTC layer (disconnect/failed).");
    // Use statusRef.current for the check to avoid race conditions on rapid disconnect/reconnect
    if (statusRef.current === "in_call") {
      updateStatus("idle"); // Use helper
      setErrorMessage("Call ended.");
    } else if (statusRef.current === "waiting") {
      updateStatus("idle"); // Use helper
      setErrorMessage("Failed to establish connection.");
    }
    setPeerId(null);
    setIsCaller(false);
    setPeerInterests([]);
    setRemoteStream(null);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    // Stop stream unless peer disconnected
    if (statusRef.current !== "disconnected_peer") {
      stopLocalStream();
      setCurrentInterest(null);
    }
  }, [stopLocalStream]); // updateStatus is stable

  // --- Socket Connection Effect ---
  useEffect(() => {
    updateStatus("connecting"); // Use helper
    console.log("Attempting to connect Socket.IO...");
    const newSocket: Socket = io(SERVER_URL);

    const onConnect = () => {
      console.log("Socket.IO Connected! ID:", newSocket.id);
      setSocket(newSocket);
      setUserId(newSocket.id);
      updateStatus("idle"); // Use helper
      setErrorMessage("");
    };

    const onDisconnect = (reason: Socket.DisconnectReason) => {
      console.log("Socket.IO Disconnected. Reason:", reason);
      setSocket(null);
      setUserId(null);
      updateStatus("offline"); // Use helper
      setErrorMessage(`Disconnected: ${reason}. Refresh?`);
      stopLocalStream();
      setPeerId(null);
      setIsCaller(false);
      setRemoteStream(null);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      setCurrentInterest(null);
    };

    const onConnectError = (err: Error) => {
      console.error("Socket.IO Connection Error:", err.message);
      updateStatus("offline"); // Use helper
      setErrorMessage(`Connection failed: ${err.message}.`);
      setSocket(null);
    };

    const onMatchFound = (data: MatchFoundPayload) => {
      console.log("Match found:", data);
      // *** FIX: Check statusRef.current instead of appStatus ***
      if (statusRef.current === "waiting") {
        setPeerId(data.peerId);
        setIsCaller(data.caller);
        setPeerInterests(data.peerInterests || []);
        updateStatus("in_call"); // Use helper
        setErrorMessage("");
      } else {
        // Log current ref status for debugging
        console.warn(
          `Received 'match-found' but statusRef was '${statusRef.current}'.`
        );
      }
    };

    const onUserDisconnected = (data: UserDisconnectedPayload) => {
      console.log(
        `App received user-disconnected signal for peer: ${data.peerId}`
      );
      // Check against peerId state (less likely to be stale here)
      if (
        data.peerId === peerId &&
        (statusRef.current === "in_call" || statusRef.current === "waiting")
      ) {
        updateStatus("disconnected_peer"); // Use helper
        setErrorMessage("Your chat partner disconnected.");
        setPeerId(null);
        setIsCaller(false);
        setRemoteStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    };

    // Register listeners
    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("connect_error", onConnectError);
    newSocket.on("match-found", onMatchFound);
    newSocket.on("user-disconnected", onUserDisconnected);

    // Cleanup
    return () => {
      console.log("Cleaning up App effect: Disconnecting Socket.IO...");
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("connect_error", onConnectError);
      newSocket.off("match-found", onMatchFound);
      newSocket.off("user-disconnected", onUserDisconnected);
      newSocket.disconnect();
      stopLocalStream();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once

  // --- UI Interaction Handlers ---

  const handleStartCall = useCallback(async () => {
    // Use statusRef.current in condition checks for immediate accuracy
    if (
      !socket?.connected ||
      statusRef.current !== "idle" ||
      interestInput.trim() === ""
    ) {
      console.warn("Cannot start call. Conditions not met:", {
        connected: socket?.connected,
        status: statusRef.current,
        interest: interestInput.trim(),
      });
      if (interestInput.trim() === "")
        setErrorMessage("Please enter an interest.");
      else if (statusRef.current !== "idle")
        setErrorMessage(`Cannot start call while ${statusRef.current}.`);
      else setErrorMessage("Not connected to server.");
      return;
    }

    const interest = interestInput.trim();
    updateStatus("submitting"); // Use helper
    setErrorMessage("");
    setCurrentInterest(interest);

    const stream = await startLocalStream();
    if (!stream) {
      // Error set in startLocalStream, status reverted to idle
      return;
    }

    // Check status *again* after await, in case user cancelled or disconnected
    if ((statusRef.current as AppStatus) !== "submitting") {
      console.warn("Status changed during stream start. Aborting find-match.");
      stopLocalStream(); // Clean up the started stream
      return;
    }

    // Proceed if stream started and status is still submitting
    updateStatus("waiting"); // Use helper
    console.log(`Emitting find-match with interest: ${interest}`);
    socket.emit("find-match", { interests: [interest] });
  }, [interestInput, socket, startLocalStream, stopLocalStream]); // Added stopLocalStream

  const handleEndCall = useCallback(() => {
    console.log("Handling End Call / Cancel Search...");
    if (socket?.connected) {
      // Use statusRef.current for accurate check
      if (statusRef.current === "waiting") {
        console.log("Emitting cancel-search");
        socket.emit("cancel-search");
      } else if (statusRef.current === "in_call") {
        console.log("Emitting disconnect-call");
        socket.emit("disconnect-call");
      }
    }
    updateStatus("idle"); // Use helper
    stopLocalStream();
    setPeerId(null);
    setIsCaller(false);
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCurrentInterest(null);
    setPeerInterests([]);
    setErrorMessage("");
  }, [socket, stopLocalStream]); // updateStatus is stable

  const handleFindNewPartner = useCallback(() => {
    // Use statusRef for check
    if (
      !socket?.connected ||
      !currentInterest ||
      statusRef.current !== "disconnected_peer"
    ) {
      console.warn("Cannot find new partner:", {
        connected: socket?.connected,
        currentInterest,
        status: statusRef.current,
      });
      // Optionally reset to idle if state is wrong
      if (statusRef.current !== "disconnected_peer") updateStatus("idle");
      return;
    }

    console.log(`Finding new partner with interest: ${currentInterest}`);
    updateStatus("waiting"); // Use helper
    setErrorMessage("");
    setPeerId(null);
    setIsCaller(false);
    setRemoteStream(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (!localStream) {
      console.warn(
        "Local stream wasn't running for find new partner. Attempting to start."
      );
      startLocalStream().then((stream) => {
        // Check status *after* await
        if (stream && socket?.connected && statusRef.current === "waiting") {
          socket.emit("find-match", { interests: [currentInterest] });
        } else if (!stream) {
          updateStatus("idle"); // Failed to get stream
        } else if (statusRef.current !== "waiting") {
          console.warn(
            "Status changed during stream start for find new partner. Aborting."
          );
          stopLocalStream(); // Clean up stream if we aborted
        }
      });
    } else {
      // Emit find-match with the *same* interest
      socket.emit("find-match", { interests: [currentInterest] });
    }
  }, [socket, currentInterest, localStream, startLocalStream, stopLocalStream]); // Added stopLocalStream

  const resetAndSelectInterest = useCallback(() => {
    handleEndCall();
    setInterestInput("");
  }, [handleEndCall]);

  // --- Render ---
  // Using the user-provided JSX structure
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br w-full from-indigo-950 via-gray-900 to-black text-gray-100 relative overflow-hidden">
      {/* --- Header --- */}
      <div className="flex items-center justify-between w-full border-b border-gray-700/50 flex-shrink-0 px-4 py-2">
        <div className="flex items-center space-x-2">
          <Video className="h-5 w-5 text-pink-400" />
          <span className="font-semibold text-gray-200">Random Video Call</span>
          {(isInCall || isWaitingForMatch) && currentInterest && (
            <div className="hidden sm:flex items-center ml-4 space-x-1.5 text-xs bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-md">
              <MessageSquareText size={12} />
              <span>Interest: {currentInterest}</span>
            </div>
          )}
        </div>
        {/* Status Indicator */}
        <div className="flex items-center space-x-2">
          {/* Use appStatus directly for indicators */}
          {appStatus === "in_call" && (
            <>
              {" "}
              <span className="text-xs font-medium text-green-400 mr-1">
                In Call
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-sm shadow-green-400/30"></div>{" "}
            </>
          )}
          {appStatus === "waiting" && (
            <>
              {" "}
              <span className="text-xs font-medium text-yellow-400 mr-1">
                Waiting...
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse shadow-sm shadow-yellow-400/30"></div>{" "}
            </>
          )}
          {appStatus === "connecting" && (
            <>
              {" "}
              <span className="text-xs font-medium text-blue-400 mr-1">
                Connecting...
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse shadow-sm shadow-blue-400/30"></div>{" "}
            </>
          )}
          {appStatus === "submitting" && ( // Added indicator for submitting
            <>
              {" "}
              <span className="text-xs font-medium text-purple-400 mr-1">
                Starting...
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse shadow-sm shadow-purple-400/30"></div>{" "}
            </>
          )}
          {appStatus === "idle" && isConnected && (
            <>
              {" "}
              <span className="text-xs font-medium text-gray-400 mr-1">
                Idle
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-gray-400 shadow-sm shadow-gray-400/30"></div>{" "}
            </>
          )}
          {appStatus === "disconnected_peer" && (
            <>
              {" "}
              <span className="text-xs font-medium text-orange-400 mr-1">
                Peer Left
              </span>{" "}
              <div className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-sm shadow-orange-400/30"></div>{" "}
            </>
          )}
          {appStatus === "offline" && (
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
      {/* --- Video Call Area --- */}
      <div className="flex-1 p-2 sm:p-4 flex flex-col relative overflow-hidden">
        {/* --- State Overlays --- */}
        {/* Combined Connecting/Submitting Overlay */}
        {(appStatus === "connecting" || appStatus === "submitting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-900/60 backdrop-blur-sm z-30">
            <RotateCw className="h-16 w-16 text-purple-400 animate-spin-slow" />
            <p className="text-lg font-semibold text-gray-200 animate-pulse">
              {appStatus === "connecting" ? "Initializing..." : "Starting..."}
            </p>
            <p className="text-sm text-gray-400">Setting things up...</p>
          </div>
        )}
        {/* Waiting Overlay */}
        {appStatus === "waiting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-gray-900/60 backdrop-blur-sm z-30">
            <Users className="h-16 w-16 text-teal-400 animate-pulse" />
            <p className="text-lg font-semibold text-gray-200">
              Finding a match...
            </p>
            <p className="text-sm text-gray-400 text-center px-4">
              Waiting for someone interested in{" "}
              <span className="font-semibold text-teal-300">
                "{currentInterest || "anything"}"
              </span>
              .
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
              onClick={handleEndCall}
            >
              Cancel Search
            </Button>
          </div>
        )}
        {/* Peer Disconnected Overlay */}
        {appStatus === "disconnected_peer" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-gray-900/60 backdrop-blur-sm z-30">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-600/20 to-red-600/20 flex items-center justify-center mb-1">
              <VideoOff className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-lg font-semibold text-gray-200">
              Partner Disconnected
            </p>
            <p className="text-sm text-gray-400">
              {errorMessage || "Looks like they left the chat."}
            </p>
            {currentInterest && (
              <Button
                size="lg"
                className="text-base font-semibold text-white rounded-full px-8 py-3 mt-2 justify-center bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                onClick={handleFindNewPartner}
                disabled={!socket?.connected}
              >
                <Search className="mr-2 h-5 w-5" />
                {`Find New Partner (${currentInterest})`}
              </Button>
            )}
            <Button
              variant="link"
              className="text-gray-400 hover:text-gray-200 mt-2"
              onClick={resetAndSelectInterest}
            >
              Change Interest or Stop
            </Button>
          </div>
        )}
        {/* Idle Overlay */}
        {appStatus === "idle" && isConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-gray-900/60 backdrop-blur-sm z-30 px-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-600/20 flex items-center justify-center mb-1">
              <Video className="h-8 w-8 text-pink-400" />
            </div>
            <p className="text-lg font-semibold text-gray-200">
              Ready to Connect?
            </p>
            <p className="text-sm text-gray-400 text-center">
              Enter an interest to find someone to chat with!
            </p>
            <div className="w-full max-w-xs space-y-2">
              <Label htmlFor="interest" className="text-gray-300">
                Your Interest
              </Label>
              <Input
                id="interest"
                type="text"
                placeholder="e.g., programming, movies, travel"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-pink-500 focus:border-pink-500 rounded-md"
                disabled={showLoadingState}
                onKeyDown={(e) =>
                  e.key === "Enter" && canStartCall && handleStartCall()
                }
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}
            <Button
              size="lg"
              className="text-base font-semibold text-white rounded-full px-8 py-3 mt-3 justify-center bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              onClick={handleStartCall}
              disabled={!canStartCall}
            >
              <Video className="mr-2 h-5 w-5" />
              {isSubmitting ? "Starting..." : "Find & Call"}
            </Button>
          </div>
        )}
        {/* Offline Overlay */}
        {appStatus === "offline" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-gray-950/80 backdrop-blur-md z-30 px-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-600/20 flex items-center justify-center mb-1">
              <VideoOff className="h-8 w-8 text-red-400" />
            </div>
            <p className="text-lg font-semibold text-gray-200">
              Server Offline
            </p>
            <p className="text-sm text-gray-400 text-center">
              {errorMessage || "Cannot connect."}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
            >
              Reload Page
            </Button>
          </div>
        )}

        {/* --- Video Layout --- */}
        {/* Simplified visibility: Show if in call */}
        <div
          className={`flex-1 flex w-full h-full gap-2 sm:gap-4 ${
            isInCall ? "opacity-100" : "opacity-0 pointer-events-none"
          } transition-opacity duration-300 delay-150 flex-col md:flex-row`}
        >
          {/* Local Video */}
          <div className="w-full md:flex-1 h-1/2 md:h-full bg-black rounded-2xl overflow-hidden relative shadow-lg border border-gray-700/30">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 z-10">
              {" "}
              <User size={12} /> You{" "}
            </div>
            {!isCameraOn && localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                {" "}
                <VideoOff className="h-10 w-10 text-red-400" />{" "}
              </div>
            )}
            {!isMicOn && localStream && (
              <div className="absolute bottom-2 right-2 p-1.5 bg-red-600/80 rounded-full z-10 shadow-md">
                {" "}
                <MicOff className="h-4 w-4 text-white" />{" "}
              </div>
            )}
            {!localStream && isInCall && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                {" "}
                <RotateCw className="h-8 w-8 text-gray-600 animate-spin-slow" />{" "}
              </div>
            )}
          </div>
          {/* Remote Video */}
          <div className="w-full md:flex-1 h-1/2 md:h-full bg-black rounded-2xl overflow-hidden relative shadow-lg border border-gray-700/30">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 z-10">
              {" "}
              <Users size={12} /> Partner{" "}
            </div>
            {(!remoteStream || remoteStream.getVideoTracks().length === 0) &&
              isInCall && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-0">
                  {" "}
                  <Users className="h-16 w-16 text-gray-600" />{" "}
                  <p className="absolute bottom-4 text-xs text-gray-500">
                    Waiting for partner's stream...
                  </p>{" "}
                </div>
              )}
          </div>
        </div>

        {/* --- Controls Bar --- */}
        {isInCall && ( // Show controls only when in call
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 sm:space-x-4 bg-gray-900/70 backdrop-blur-lg p-3 rounded-full shadow-xl z-20">
            <Button
              size="icon"
              onClick={toggleMic}
              className={`rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200 text-white ${
                isMicOn
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-red-600/80 hover:bg-red-700/90"
              }`}
            >
              {" "}
              {isMicOn ? (
                <Mic size={20} className="sm:w-6 sm:h-6" />
              ) : (
                <MicOff size={20} className="sm:w-6 sm:h-6" />
              )}{" "}
            </Button>
            <Button
              onClick={handleEndCall}
              variant="destructive"
              size="icon"
              className="rounded-full h-16 w-16 sm:h-20 sm:w-20 bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 transition-all duration-300 transform hover:scale-105"
            >
              {" "}
              <Phone size={24} className="rotate-[135deg] sm:w-7 sm:h-7" />{" "}
            </Button>
            <Button
              size="icon"
              onClick={toggleCamera}
              className={`rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all duration-200 text-white ${
                isCameraOn
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-red-600/80 hover:bg-red-700/90"
              }`}
            >
              {" "}
              {isCameraOn ? (
                <Video size={20} className="sm:w-6 sm:h-6" />
              ) : (
                <VideoOff size={20} className="sm:w-6 sm:h-6" />
              )}{" "}
            </Button>
          </div>
        )}
      </div>{" "}
      {/* End Video Call Area */}
      {/* Render WebRTCHandler (conditionally) */}
      {/* Render only when actively trying to connect or in call AND have necessary details */}
      {(isInCall || isWaitingForMatch || isSubmitting) &&
        socket &&
        peerId &&
        localStream && (
          <WebRTCHandler
            key={peerId} // Force re-mount on new peer
            socket={socket}
            peerId={peerId}
            isCaller={isCaller}
            localStream={localStream}
            setRemoteStream={setRemoteStream}
            onCallEnded={handleCallEndedByWebRTC}
            onCallEstablished={handleCallEstablished}
          />
        )}
      {/* Also render if we are the caller waiting for an answer */}
      {isWaitingForMatch && socket && isCaller && localStream && peerId && (
        <WebRTCHandler
          key={peerId}
          socket={socket}
          peerId={peerId}
          isCaller={isCaller}
          localStream={localStream}
          setRemoteStream={setRemoteStream}
          onCallEnded={handleCallEndedByWebRTC}
          onCallEstablished={handleCallEstablished}
        />
      )}
    </div> // End Main Container
  );
}

// Add spinner animation keyframes globally if not already done
const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } } @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
const existingStyleSheet = document.getElementById("app-animations");
if (!existingStyleSheet) {
  const styleSheet = document.createElement("style");
  styleSheet.id = "app-animations";
  styleSheet.type = "text/css";
  styleSheet.innerText = spinKeyframes;
  document.head.appendChild(styleSheet);
}

export default VideoCallInterface;
