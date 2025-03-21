
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
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string | null = null;
  private userId: string | null = null;
  
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;

  constructor() {
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners() {
    // Listen for signaling messages in the room
    supabase
      .channel('webrtc')
      .on('broadcast', { event: 'webrtc-signal' }, ({ payload }) => {
        this.handleSignalingMessage(payload);
      })
      .subscribe();
  }

  async initialize(userId: string): Promise<MediaStream> {
    this.userId = userId;
    
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
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
    
    // Create RTCPeerConnection
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // Add local tracks to peer connection
    this.localStream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream);
      }
    });
    
    // Set up remote stream handling
    this.remoteStream = new MediaStream();
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
      
      if (this.onRemoteStreamCallback && this.remoteStream) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };
    
    // Set up ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId: this.roomId,
          userId: this.userId,
        });
      }
    };
    
    // Set up connection state change handling
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection && this.onConnectionStateChangeCallback) {
        this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
      }
    };
    
    // Check if the user is the initiator (first to join the room)
    const { data } = await supabase
      .from('video_rooms')
      .select('*')
      .eq('room_id', roomId)
      .single();
    
    if (!data) {
      // User is the initiator (create the room)
      await supabase.from('video_rooms').insert({
        room_id: roomId,
        initiator_id: this.userId,
        status: 'waiting',
      });
      
      // Wait for another peer to join
    } else if (data.status === 'waiting') {
      // User is the second peer, create and send offer
      await supabase
        .from('video_rooms')
        .update({ status: 'connected', peer_id: this.userId })
        .eq('room_id', roomId);
      
      await this.createAndSendOffer();
    } else {
      throw new Error('Room is full or unavailable');
    }
  }
  
  private async createAndSendOffer() {
    if (!this.peerConnection) return;
    
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage({
        type: 'offer',
        sdp: this.peerConnection.localDescription,
        roomId: this.roomId,
        userId: this.userId,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }
  
  private async handleSignalingMessage(message: any) {
    if (!this.peerConnection || message.roomId !== this.roomId || message.userId === this.userId) {
      return;
    }
    
    switch (message.type) {
      case 'offer':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.sendSignalingMessage({
          type: 'answer',
          sdp: this.peerConnection.localDescription,
          roomId: this.roomId,
          userId: this.userId,
        });
        break;
        
      case 'answer':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        break;
        
      case 'ice-candidate':
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        break;
        
      default:
        console.warn('Unknown signaling message type:', message.type);
    }
  }
  
  private async sendSignalingMessage(message: any) {
    await supabase
      .channel('webrtc')
      .send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: message,
      });
  }
  
  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
    
    // If the remote stream already exists, call the callback immediately
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
  }
  
  onConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }
  
  toggleCamera() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return videoTracks[0]?.enabled || false;
    }
    return false;
  }
  
  toggleMicrophone() {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return audioTracks[0]?.enabled || false;
    }
    return false;
  }
  
  async disconnect() {
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Stop local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Clear remote stream
    this.remoteStream = null;
    
    // Update room status if this user was in a room
    if (this.roomId) {
      await supabase
        .from('video_rooms')
        .update({ status: 'closed' })
        .eq('room_id', this.roomId);
      
      this.roomId = null;
    }
  }
}

export const webRTCService = new WebRTCService();
