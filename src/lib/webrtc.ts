import React, {
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { Socket } from "socket.io-client";

// --- Type Definitions ---
type SocketId = string;

// --- Props Interface ---
interface WebRTCHandlerProps {
  socket: Socket;
  peerId: SocketId;
  isCaller: boolean;
  localStream: MediaStream | null;
  setRemoteStream: Dispatch<SetStateAction<MediaStream | null>>;
  onCallEnded: () => void;
  onCallEstablished: () => void;
}

// Configuration for STUN servers
const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // Add TURN servers here for production if STUN isn't enough
  ],
};

/**
 * Component to manage WebRTC connection logic using Socket.IO.
 */
function WebRTCHandler({
  socket,
  peerId,
  isCaller,
  localStream,
  setRemoteStream,
  onCallEnded,
  onCallEstablished,
}: WebRTCHandlerProps) {
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const isConnected = useRef<boolean>(false);

  // --- Cleanup Function ---
  const cleanupWebRTC = useCallback(() => {
    console.log("(WebRTCHandler) Cleaning up WebRTC resources...");
    if (isConnected.current) {
      if (onCallEnded) {
        console.log("(WebRTCHandler) Calling onCallEnded callback.");
        onCallEnded();
      }
    }
    isConnected.current = false;

    setRemoteStream(null); // Clear remote stream in parent state

    if (peerConnection.current) {
      peerConnection.current.ontrack = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.close();
      peerConnection.current = null;
      console.log("(WebRTCHandler) PeerConnection closed.");
    }
  }, [onCallEnded, setRemoteStream]);

  // --- Initialize Peer Connection ---
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) {
      console.warn(
        "(WebRTCHandler) PeerConnection already exists. Cleaning up old one first."
      );
      cleanupWebRTC();
    }

    if (!localStream) {
      console.error(
        "(WebRTCHandler) Local stream not provided for PeerConnection"
      );
      return null;
    }
    console.log("(WebRTCHandler) Initializing RTCPeerConnection...");
    const pc = new RTCPeerConnection(peerConnectionConfig);

    // --- Event Handlers ---
    pc.ontrack = (event: RTCTrackEvent) => {
      // *** Log when track event occurs ***
      console.log(
        `(WebRTCHandler) *** Remote track received! Kind: ${event.track.kind}, Stream ID: ${event.streams[0]?.id}`
      );
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log(
          `(WebRTCHandler) Calling setRemoteStream with stream ID: ${remoteStream.id}`
        );
        setRemoteStream(remoteStream); // Update parent state
        if (!isConnected.current) {
          console.log(
            "(WebRTCHandler) Calling onCallEstablished callback (from ontrack)."
          );
          onCallEstablished(); // Notify parent call is likely up
        }
        isConnected.current = true;
      } else {
        console.warn("(WebRTCHandler) No stream found in track event.");
      }
    };

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socket?.connected) {
        // Check socket connection
        // console.log('(WebRTCHandler) Generated ICE candidate:', event.candidate); // Keep this commented unless needed (very verbose)
        console.log("(WebRTCHandler) Emitting ICE candidate to peer:", peerId);
        socket.emit("ice-candidate", { candidate: event.candidate });
      } else if (!event.candidate) {
        console.log("(WebRTCHandler) All local ICE candidates have been sent.");
      } else {
        console.warn(
          "(WebRTCHandler) Cannot send ICE candidate, socket disconnected?"
        );
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!pc) return;
      // *** Log ICE state changes ***
      console.log(
        `(WebRTCHandler) *** ICE Connection State: ${pc.iceConnectionState}`
      );
      switch (pc.iceConnectionState) {
        case "checking":
          console.log("(WebRTCHandler) ICE checking...");
          break;
        case "connected":
          console.log(
            "(WebRTCHandler) *** ICE Connected! Peers should be able to communicate directly."
          );
          if (!isConnected.current) {
            // Check internal flag before calling callback
            console.log(
              "(WebRTCHandler) Calling onCallEstablished callback (from ICE connected)."
            );
            onCallEstablished();
          }
          isConnected.current = true;
          break;
        case "completed":
          console.log("(WebRTCHandler) ICE Completed. All checks done.");
          // Ensure connected flag is true if completed is reached
          if (!isConnected.current) {
            console.warn(
              "(WebRTCHandler) ICE Completed but not marked connected, setting flag."
            );
            isConnected.current = true;
            onCallEstablished();
          }
          break;
        case "disconnected":
          console.warn(
            "(WebRTCHandler) ICE Disconnected. Connection lost temporarily?"
          );
          // Consider cleanup or retry logic here if needed
          break;
        case "failed":
          console.error(
            "(WebRTCHandler) *** ICE Connection Failed. Cannot connect to peer."
          );
          setTimeout(cleanupWebRTC, 0); // Schedule cleanup
          break;
        case "closed":
          console.log("(WebRTCHandler) ICE Connection Closed.");
          // Cleanup might have already been called, but ensure it happens
          setTimeout(cleanupWebRTC, 0);
          break;
        default:
          console.log(
            `(WebRTCHandler) Unhandled ICE State: ${pc.iceConnectionState}`
          );
          break;
      }
    };

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      try {
        console.log(`(WebRTCHandler) Adding local ${track.kind} track.`);
        pc.addTrack(track, localStream);
      } catch (error) {
        console.error("(WebRTCHandler) Error adding track:", error);
      }
    });

    return pc;
  }, [
    localStream,
    socket,
    peerId,
    cleanupWebRTC,
    setRemoteStream,
    onCallEstablished,
  ]); // Added peerId

  // --- Start Call (Caller) ---
  const startCall = useCallback(async () => {
    if (!peerConnection.current || !socket?.connected) {
      // Check socket connection
      console.error(
        "(WebRTCHandler) PeerConnection or Socket not ready in startCall."
      );
      return;
    }
    console.log("(WebRTCHandler) Creating SDP offer...");
    try {
      const offer = await peerConnection.current.createOffer();
      console.log("(WebRTCHandler) Setting local description (offer)...");
      await peerConnection.current.setLocalDescription(offer);
      console.log(
        "(WebRTCHandler) Local description (offer) set. Emitting to peer:",
        peerId
      );
      socket.emit("offer", { sdp: offer });
    } catch (error) {
      console.error("(WebRTCHandler) Error creating/sending offer:", error);
      cleanupWebRTC();
    }
  }, [socket, peerId, cleanupWebRTC]); // Added peerId

  // --- Socket Event Handlers ---
  const handleOffer = useCallback(
    async (offerData: { sender: SocketId; sdp: unknown }) => {
      if (!peerConnection.current) {
        console.warn(
          "(WebRTCHandler) PeerConnection not ready for handleOffer. Should init first."
        );
        return;
      }
      if (!offerData.sdp || typeof offerData.sdp !== "object") {
        console.error("(WebRTCHandler) Invalid SDP received in offer");
        return;
      }

      console.log(
        `(WebRTCHandler) *** Received Offer from ${offerData.sender}. Setting remote description...`
      );
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offerData.sdp as RTCSessionDescriptionInit)
        );
        console.log(
          "(WebRTCHandler) Remote description (offer) set. Creating answer..."
        );

        const answer = await peerConnection.current.createAnswer();
        console.log("(WebRTCHandler) Setting local description (answer)...");
        await peerConnection.current.setLocalDescription(answer);
        console.log(
          "(WebRTCHandler) Local description (answer) set. Emitting to peer:",
          offerData.sender
        );

        if (socket?.connected) {
          // Check socket connection
          socket.emit("answer", { sdp: answer });
        } else {
          console.error(
            "(WebRTCHandler) Socket not connected, cannot send answer."
          );
        }
      } catch (error) {
        console.error(
          "(WebRTCHandler) Error handling offer/creating answer:",
          error
        );
        cleanupWebRTC();
      }
    },
    [socket, cleanupWebRTC]
  ); // Removed peerConnection.current from deps

  const handleAnswer = useCallback(
    async (answerData: { sender: SocketId; sdp: unknown }) => {
      if (!peerConnection.current) {
        console.error(
          "(WebRTCHandler) PeerConnection not initialized in handleAnswer."
        );
        return;
      }
      if (!answerData.sdp || typeof answerData.sdp !== "object") {
        console.error("(WebRTCHandler) Invalid SDP received in answer");
        return;
      }
      console.log(
        `(WebRTCHandler) *** Received Answer from ${answerData.sender}. Setting remote description...`
      );
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answerData.sdp as RTCSessionDescriptionInit)
        );
        console.log("(WebRTCHandler) Remote description (answer) set.");
      } catch (error) {
        console.error(
          "(WebRTCHandler) Error setting remote description (answer):",
          error
        );
        cleanupWebRTC();
      }
    },
    [cleanupWebRTC]
  ); // Removed peerConnection.current from deps

  const handleIceCandidate = useCallback(
    async (candidateData: { sender: SocketId; candidate: unknown }) => {
      if (!peerConnection.current) {
        console.warn(
          "(WebRTCHandler) PeerConnection not ready when ICE candidate received."
        );
        return;
      }
      if (
        !candidateData.candidate ||
        typeof candidateData.candidate !== "object"
      ) {
        console.error("(WebRTCHandler) Invalid ICE candidate received");
        return;
      }
      console.log(
        `(WebRTCHandler) *** Received ICE candidate from ${candidateData.sender}. Adding...`
      );
      try {
        const candidate = new RTCIceCandidate(
          candidateData.candidate as RTCIceCandidateInit
        );
        await peerConnection.current.addIceCandidate(candidate);
        console.log("(WebRTCHandler) Added received ICE candidate.");
      } catch (error: any) {
        // Log non-benign errors
        if (
          error.name !== "InvalidStateError" &&
          !error.message?.includes("closed")
        ) {
          console.error(
            "(WebRTCHandler) Error adding received ICE candidate:",
            error
          );
        } else {
          console.warn(
            `(WebRTCHandler) Ignored error adding ICE candidate (likely PC closed): ${error.message}`
          );
        }
      }
    },
    []
  ); // Removed peerConnection.current from deps

  // --- Effect to Initialize PC and Start Call if Caller ---
  useEffect(() => {
    console.log(
      "(WebRTCHandler) Initializing effect run. isCaller:",
      isCaller,
      "LocalStream available:",
      !!localStream
    );
    isConnected.current = false; // Reset connected flag on new peer/stream
    if (localStream) {
      peerConnection.current = initializePeerConnection();
      if (isCaller && peerConnection.current) {
        startCall();
      }
    } else {
      console.warn(
        "(WebRTCHandler) Local stream not ready yet in init effect."
      );
    }

    return () => {
      console.log(
        "(WebRTCHandler) Unmounting or dependencies changed, running cleanup..."
      );
      cleanupWebRTC();
    };
  }, [
    localStream,
    isCaller,
    peerId,
    initializePeerConnection,
    startCall,
    cleanupWebRTC,
  ]); // Added peerId

  // --- Socket.IO Event Listeners Effect ---
  useEffect(() => {
    if (!socket) {
      console.log("(WebRTCHandler) Socket not available, skipping listeners.");
      return;
    }

    console.log(
      "(WebRTCHandler) Setting up Socket.IO listeners for WebRTC signals..."
    );

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);

    const handlePeerDisconnect = (data: { peerId: SocketId }) => {
      // Ensure the disconnect is for the *current* peer this handler is managing
      if (data.peerId === peerId) {
        console.log(
          `(WebRTCHandler) Peer ${data.peerId} disconnected signal received.`
        );
        cleanupWebRTC();
      } else {
        console.log(
          `(WebRTCHandler) Ignored disconnect signal for different peer: ${data.peerId} (current: ${peerId})`
        );
      }
    };
    socket.on("user-disconnected", handlePeerDisconnect);

    // Cleanup listeners
    return () => {
      console.log("(WebRTCHandler) Cleaning up Socket.IO listeners...");
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-disconnected", handlePeerDisconnect);
    };
  }, [
    socket,
    peerId,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    cleanupWebRTC,
  ]); // Added peerId

  // This component manages logic and doesn't render anything itself
  return null;
}

export default WebRTCHandler;
