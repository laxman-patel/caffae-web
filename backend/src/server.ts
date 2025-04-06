// src/server.ts
import http from "http";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

// --- Type Definitions ---

type SocketId = string;
type Interest = string;
type UserStatus = "idle" | "waiting" | "in-call";

interface UserData {
  interests: Set<Interest>;
  status: UserStatus;
  peerId?: SocketId;
}

// Define payloads for client-to-server events
interface ClientToServerEvents extends DefaultEventsMap {
  "find-match": (payload: { interests: string[] }) => void;
  "cancel-search": () => void;
  offer: (payload: { sdp: unknown }) => void; // Use unknown for safety, validate/cast if needed
  answer: (payload: { sdp: unknown }) => void;
  "ice-candidate": (payload: { candidate: unknown }) => void;
  "disconnect-call": () => void;
}

// Define payloads for server-to-client events
interface ServerToClientEvents extends DefaultEventsMap {
  "match-found": (payload: {
    peerId: SocketId;
    caller: boolean;
    peerInterests: string[];
  }) => void;
  offer: (payload: { sender: SocketId; sdp: unknown }) => void;
  answer: (payload: { sender: SocketId; sdp: unknown }) => void;
  "ice-candidate": (payload: { sender: SocketId; candidate: unknown }) => void;
  "user-disconnected": (payload: { peerId: SocketId }) => void;
  // 'error-message': (message: string) => void; // Example error event
}

// --- Server Setup ---

const httpServer = http.createServer();
// Strongly type the Socket.IO Server instance
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*", // Restrict in production
    methods: ["GET", "POST"],
  },
});

const PORT: number = 8088;

// --- Data Structures ---

const users = new Map<SocketId, UserData>();
const waitingUsers = new Map<Interest, Set<SocketId>>();

console.log(`Socket.IO Signaling Server starting on port ${PORT}`);

// --- Connection Handler ---

// Use the strongly typed Server instance for 'io' and Socket
io.on(
  "connection",
  (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const userId: SocketId = socket.id;
    console.log(`Client connected: ${userId}`);

    // Initialize user data
    users.set(userId, { interests: new Set(), status: "idle" });

    // --- Socket Event Handlers ---

    socket.on("find-match", (payload) => {
      // Basic validation (TypeScript helps, but runtime checks are good)
      if (
        !payload ||
        !Array.isArray(payload.interests) ||
        payload.interests.some((i) => typeof i !== "string")
      ) {
        console.error(`Invalid 'find-match' payload from ${userId}:`, payload);
        // socket.emit('error-message', 'Invalid interests format.');
        return;
      }

      const currentUser = users.get(userId);
      if (!currentUser) {
        console.error(`User ${userId} not found during find-match.`);
        return;
      }

      // Ensure interests are strings before creating the Set
      currentUser.interests = new Set(
        payload.interests.filter((i) => typeof i === "string")
      );
      currentUser.status = "waiting";
      currentUser.peerId = undefined;
      console.log(
        `User ${userId} is waiting with interests:`,
        Array.from(currentUser.interests)
      );
      findMatchForUser(userId);
    });

    socket.on("cancel-search", () => {
      const currentUser = users.get(userId);
      if (currentUser && currentUser.status === "waiting") {
        removeFromWaiting(userId);
        currentUser.status = "idle";
        console.log(`User ${userId} cancelled search.`);
      }
    });

    // --- WebRTC Signaling ---

    socket.on("offer", (payload) => {
      const currentUser = users.get(userId);
      // Check if user exists and is currently paired
      if (!currentUser || !currentUser.peerId) {
        console.warn(
          `User ${userId} tried to send offer but is not in a call.`
        );
        return;
      }
      console.log(`Relaying 'offer' from ${userId} to ${currentUser.peerId}`);
      // Emit to the specific peer socket
      io.to(currentUser.peerId).emit("offer", {
        sender: userId,
        sdp: payload.sdp, // Forward the payload directly
      });
    });

    socket.on("answer", (payload) => {
      const currentUser = users.get(userId);
      if (!currentUser || !currentUser.peerId) {
        console.warn(
          `User ${userId} tried to send answer but is not in a call.`
        );
        return;
      }
      console.log(`Relaying 'answer' from ${userId} to ${currentUser.peerId}`);
      io.to(currentUser.peerId).emit("answer", {
        sender: userId,
        sdp: payload.sdp,
      });
    });

    socket.on("ice-candidate", (payload) => {
      const currentUser = users.get(userId);
      if (!currentUser || !currentUser.peerId) {
        // This can happen normally if candidates arrive after disconnect
        // console.warn(`User ${userId} tried to send ice-candidate but is not in a call.`);
        return;
      }
      // console.log(`Relaying 'ice-candidate' from ${userId} to ${currentUser.peerId}`); // Verbose
      io.to(currentUser.peerId).emit("ice-candidate", {
        sender: userId,
        candidate: payload.candidate,
      });
    });

    // --- Disconnection ---

    socket.on("disconnect-call", () => {
      handleDisconnect(userId, true); // Intentional disconnect
    });

    socket.on("disconnect", (reason: string) => {
      console.log(`Client disconnected: ${userId}, Reason: ${reason}`);
      handleDisconnect(userId, false); // Unintentional disconnect
      users.delete(userId); // Clean up user from main map
    });

    socket.on("connect_error", (err: Error) => {
      console.error(`Connection Error for socket ${userId}: ${err.message}`);
      handleDisconnect(userId, false);
      users.delete(userId);
    });
  }
);

// --- Helper Functions (Typed) ---

function findMatchForUser(userId: SocketId): void {
  const currentUser = users.get(userId);
  // Guard clauses for type safety and logic
  if (!currentUser || currentUser.status !== "waiting") {
    console.log(`User ${userId} is not waiting, cannot find match.`);
    return;
  }

  console.log(`Attempting to find match for ${userId}`);
  let matchedUserId: SocketId | null = null;

  // Iterate through interests to find a potential match
  for (const interest of currentUser.interests) {
    const potentialPeers = waitingUsers.get(interest);
    if (potentialPeers) {
      for (const potentialPeerId of potentialPeers) {
        if (potentialPeerId !== userId) {
          const potentialPeer = users.get(potentialPeerId);
          // Ensure the potential peer is valid and waiting
          if (potentialPeer && potentialPeer.status === "waiting") {
            matchedUserId = potentialPeerId;
            break; // Found a match
          }
        }
      }
    }
    if (matchedUserId) break; // Stop searching once a match is found
  }

  if (matchedUserId) {
    const peerUser = users.get(matchedUserId);
    // This check is important due to potential race conditions
    if (!peerUser || peerUser.status !== "waiting") {
      console.warn(
        `Match found (${matchedUserId}) but peer is no longer waiting. Aborting match.`
      );
      // Put the current user back into the waiting pool if they weren't removed yet
      currentUser.status = "waiting";
      addToWaiting(userId, currentUser.interests);
      return;
    }

    console.log(`Match found: ${userId} <-> ${matchedUserId}`);

    // Update states and link peers
    currentUser.status = "in-call";
    currentUser.peerId = matchedUserId;
    peerUser.status = "in-call";
    peerUser.peerId = userId;

    // Remove both from the waiting pool
    removeFromWaiting(userId);
    removeFromWaiting(matchedUserId);

    // Notify clients about the match
    io.to(userId).emit("match-found", {
      peerId: matchedUserId,
      caller: true, // This user will initiate the offer
      peerInterests: Array.from(peerUser.interests),
    });
    io.to(matchedUserId).emit("match-found", {
      peerId: userId,
      caller: false, // This user will wait for the offer
      peerInterests: Array.from(currentUser.interests),
    });
  } else {
    console.log(
      `No suitable match found for ${userId}, adding to waiting pool.`
    );
    addToWaiting(userId, currentUser.interests);
  }
}

function addToWaiting(userId: SocketId, interests: Set<Interest>): void {
  interests.forEach((interest) => {
    if (!waitingUsers.has(interest)) {
      waitingUsers.set(interest, new Set<SocketId>());
    }
    // Add user only if the set exists (TypeScript type guard)
    waitingUsers.get(interest)?.add(userId);
  });
}

function removeFromWaiting(userId: SocketId): void {
  waitingUsers.forEach((userIdsSet, interest) => {
    if (userIdsSet.has(userId)) {
      userIdsSet.delete(userId);
      // Clean up empty interest sets from the map
      if (userIdsSet.size === 0) {
        waitingUsers.delete(interest);
      }
    }
  });
}

function handleDisconnect(userId: SocketId, intentional: boolean): void {
  console.log(`Handling disconnect for ${userId}. Intentional: ${intentional}`);
  const currentUser = users.get(userId);
  if (!currentUser) return; // User already removed or never existed

  // If user was waiting, remove them from the pool
  if (currentUser.status === "waiting") {
    removeFromWaiting(userId);
  }

  // If user was in a call, notify the peer
  const peerId = currentUser.peerId;
  if (currentUser.status === "in-call" && peerId) {
    const peerUser = users.get(peerId);
    if (peerUser) {
      console.log(`Notifying peer ${peerId} about disconnection of ${userId}`);
      // Reset peer's state
      peerUser.peerId = undefined;
      peerUser.status = "idle"; // Set peer back to idle state
      // Notify the peer client
      io.to(peerId).emit("user-disconnected", { peerId: userId });

      // Optional: Try finding a new match for the remaining peer?
      // findMatchForUser(peerId);
    }
  }

  // Reset the disconnecting user's state locally before final deletion in the main handler
  currentUser.status = "idle";
  currentUser.peerId = undefined;
}

// --- Start Server ---

httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
