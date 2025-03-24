import { io, Socket } from 'socket.io-client';
import { supabase } from './supabase';

// Configuration for ICE servers (STUN/TURN)
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor() {
    this.socket = io(import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.socket?.emit('answer', answer, this.roomId);
    });

    this.socket.on('answer', async (answer: RTCSessionDescriptionInit) => {
      if (!this.peerConnection) return;
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    this.socket.on('ice-candidate', async (candidate: RTCIceCandidateInit) => {
      if (!this.peerConnection) return;
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    this.socket.on('user-disconnected', () => {
      this.handleDisconnection();
    });
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection(configuration);

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit('ice-candidate', event.candidate, this.roomId);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(event.streams[0]);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChangeCallback && this.peerConnection) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };
  }

  async initialize(userId: string): Promise<MediaStream> {
    this.userId = userId;
    this.setupPeerConnection();
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    if (!this.localStream) {
      throw new Error('Local stream not initialized');
    }
    
    this.roomId = roomId;
    this.socket?.emit('join-room', roomId);
    
    const offer = await this.peerConnection?.createOffer();
    await this.peerConnection?.setLocalDescription(offer);
    this.socket?.emit('offer', offer, roomId);
  }
  
  async disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.socket) {
      this.socket.emit('leave-room', this.roomId);
      this.socket.disconnect();
      this.socket = null;
    }

    this.roomId = null;
    this.userId = null;
  }
  
  toggleCamera(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return false;
    
    videoTrack.enabled = !videoTrack.enabled;
    return videoTrack.enabled;
  }
  
  toggleMicrophone(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (!audioTrack) return false;
    
    audioTrack.enabled = !audioTrack.enabled;
    return audioTrack.enabled;
  }
  
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }
  
  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  private handleDisconnection() {
    if (this.onConnectionStateChangeCallback) {
      this.onConnectionStateChangeCallback('disconnected');
    }
  }
}

export const webRTCService = new WebRTCService();
