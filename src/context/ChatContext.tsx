import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { webRTCService } from '@/lib/webrtc';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface ChatContextType {
  isConnecting: boolean;
  isConnected: boolean;
  otherUserDisconnected: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  findNewPartner: () => Promise<void>;
  toggleCamera: () => boolean;
  toggleMic: () => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserDisconnected, setOtherUserDisconnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Set up event listeners for WebRTC service
    webRTCService.onRemoteStream((stream) => {
      setRemoteStream(stream);
    });
    
    webRTCService.onConnectionStateChange((state) => {
      setConnectionState(state);
      
      if (state === 'connected') {
        setIsConnecting(false);
        setIsConnected(true);
        setOtherUserDisconnected(false);
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setIsConnected(false);
        setOtherUserDisconnected(true);
      }
    });
    
    // Clean up when component unmounts
    return () => {
      disconnect();
    };
  }, []);
  
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15);
  };
  
  const findAvailableRoom = async () => {
    // Look for an available room (status = 'waiting')
    const { data: availableRoom } = await supabase
      .from('video_rooms')
      .select('*')
      .eq('status', 'waiting')
      .limit(1)
      .single();
    
    if (availableRoom) {
      return availableRoom.room_id;
    }
    
    // If no available room, create a new one
    const newRoomId = generateRoomId();
    return newRoomId;
  };
  
  const connect = async () => {
    if (!user || isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setOtherUserDisconnected(false);
    
    try {
      // Initialize WebRTC and get local stream
      const stream = await webRTCService.initialize(user.id);
      setLocalStream(stream);
      
      // Find or create a room
      const roomId = await findAvailableRoom();
      
      // Join the room
      await webRTCService.joinRoom(roomId);
      
      // The connection state will be updated by the event listener
    } catch (error) {
      console.error('Error connecting to video call:', error);
      setIsConnecting(false);
      
      toast({
        title: "Connection Failed",
        description: "Failed to establish video connection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const disconnect = async () => {
    if (!isConnected && !isConnecting) return;
    
    try {
      await webRTCService.disconnect();
      
      setIsConnected(false);
      setIsConnecting(false);
      setOtherUserDisconnected(false);
      setLocalStream(null);
      setRemoteStream(null);
      
      toast({
        title: "Disconnected",
        description: "You have disconnected from the video call.",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };
  
  const findNewPartner = async () => {
    await disconnect();
    await connect();
  };
  
  const toggleCamera = () => {
    const isEnabled = webRTCService.toggleCamera();
    setIsCameraOn(isEnabled);
    return isEnabled;
  };
  
  const toggleMic = () => {
    const isEnabled = webRTCService.toggleMicrophone();
    setIsMicOn(isEnabled);
    return isEnabled;
  };
  
  const value = {
    isConnecting,
    isConnected,
    otherUserDisconnected,
    localStream,
    remoteStream,
    connectionState,
    isCameraOn,
    isMicOn,
    connect,
    disconnect,
    findNewPartner,
    toggleCamera,
    toggleMic,
  };
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
