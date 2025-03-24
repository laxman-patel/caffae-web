import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Configure CORS for Express
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  credentials: true
}));

const httpServer = createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['*']
  },
  transports: ['websocket', 'polling']
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zpuhyuvifzcrquihmxax.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwdWh5dXZpZnpjcnF1aWhteGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1OTI4ODksImV4cCI6MjA1ODE2ODg4OX0.X1EDX94UayTTAhiDjzLemhSpPfG-mF862o0giqoecXQ'
);

// Store active rooms and their participants
const activeRooms = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', async (roomId: string) => {
    try {
      // Join the socket room
      socket.join(roomId);

      // Get or create room participants set
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      const participants = activeRooms.get(roomId)!;

      // Add current user to participants
      participants.add(socket.id);

      // If this is the second participant, notify both users
      if (participants.size === 2) {
        const participantsArray = Array.from(participants);
        io.to(roomId).emit('room-ready', {
          initiator: participantsArray[0],
          peer: participantsArray[1],
        });
      }

      // Update room status in database
      await supabase
        .from('video_rooms')
        .upsert({
          room_id: roomId,
          status: participants.size === 2 ? 'connected' : 'waiting',
          last_active: new Date().toISOString(),
        });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('offer', (offer: { type: string; sdp: string }, roomId: string) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (answer: { type: string; sdp: string }, roomId: string) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate: { candidate: string; sdpMid?: string; sdpMLineIndex?: number }, roomId: string) => {
    socket.to(roomId).emit('ice-candidate', candidate);
  });

  socket.on('leave-room', async (roomId: string) => {
    try {
      // Remove user from room participants
      const participants = activeRooms.get(roomId);
      if (participants) {
        participants.delete(socket.id);
        
        // If room is empty, remove it
        if (participants.size === 0) {
          activeRooms.delete(roomId);
        } else {
          // Notify remaining participants
          socket.to(roomId).emit('user-disconnected');
        }
      }
 
      // Update room status in database
      await supabase
        .from('video_rooms')
        .update({
          status: 'closed',
          last_active: new Date().toISOString(),
        })
        .eq('room_id', roomId);

      // Leave the socket room
      socket.leave(roomId);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);

    // Find and clean up any rooms this user was in
    for (const [roomId, participants] of activeRooms.entries()) {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        
        if (participants.size === 0) {
          activeRooms.delete(roomId);
        } else {
          io.to(roomId).emit('user-disconnected');
        }

        // Update room status in database
        await supabase
          .from('video_rooms')
          .update({
            status: 'closed',
            last_active: new Date().toISOString(),
          })
          .eq('room_id', roomId);
      }
    }
  });
});

// Clean up inactive rooms periodically
setInterval(async () => {
  const inactiveThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes

  for (const [roomId, participants] of activeRooms.entries()) {
    const { data: room } = await supabase
      .from('video_rooms')
      .select('last_active')
      .eq('room_id', roomId)
      .single();

    if (room && new Date(room.last_active) < inactiveThreshold) {
      activeRooms.delete(roomId);
      io.to(roomId).emit('room-closed');
      
      await supabase
        .from('video_rooms')
        .update({
          status: 'closed',
          last_active: new Date().toISOString(),
        })
        .eq('room_id', roomId);
    }
  }
}, 60 * 1000); // Check every minute

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 