/**
 * Mondrian Synchronization Server
 *
 * Broadcasts generation parameters to all connected clients
 * so they render identical Mondrian compositions in sync.
 */

import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import {
  GenerationEvent,
  AudioEvent,
  WelcomeEvent,
  UserCountEvent,
  SyncEvent,
  JoinEvent,
  SyncRequestEvent,
  generateRandomParams,
} from "../../shared";

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"],
  },
});

// Configuration
const PORT = process.env.PORT || 3001;
const GENERATION_INTERVAL = 5000; // 5 seconds between new compositions
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Track connected clients
const connectedClients = new Map<string, { id: string; connectedAt: number }>();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    clients: connectedClients.size,
    uptime: process.uptime(),
  });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✓ Client connected: ${socket.id}`);

  // Add to connected clients
  connectedClients.set(socket.id, {
    id: socket.id,
    connectedAt: Date.now(),
  });

  // Send welcome message
  const welcomeEvent: WelcomeEvent = {
    event: "welcome",
    clientId: socket.id,
    serverTime: Date.now(),
  };
  socket.emit("welcome", welcomeEvent);

  // Broadcast user count
  broadcastUserCount();

  // Handle join event
  socket.on("join", (data: JoinEvent) => {
    console.log(
      `  Client ${socket.id} joined from ${data.userAgent || "unknown"}`
    );
  });

  // Handle time sync requests
  socket.on("sync_request", (data: SyncRequestEvent) => {
    const syncEvent: SyncEvent = {
      event: "sync",
      serverTime: Date.now(),
      clientTime: data.clientTime,
    };
    socket.emit("sync", syncEvent);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`✗ Client disconnected: ${socket.id}`);
    connectedClients.delete(socket.id);
    broadcastUserCount();
  });
});

// Broadcast user count to all clients
function broadcastUserCount() {
  const userCountEvent: UserCountEvent = {
    event: "users",
    count: connectedClients.size,
  };
  io.emit("users", userCountEvent);
}

// Generate and broadcast new composition
function generateAndBroadcast() {
  // Only generate if there are connected clients
  if (connectedClients.size === 0) {
    return;
  }

  const seed = Date.now(); // Use timestamp as seed for uniqueness
  const params = generateRandomParams(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Create generation event
  const generationEvent: GenerationEvent = {
    event: "generate",
    timestamp: Date.now(),
    seed,
    depth: params.depth,
    colorChance: params.colorChance,
    lineWeight: params.lineWeight,
    duration: GENERATION_INTERVAL,
  };

  // Broadcast to all clients
  io.emit("generate", generationEvent);
  console.log(
    `→ Generated: seed=${seed}, depth=${params.depth}, clients=${connectedClients.size}`
  );

  // Generate audio event
  const shouldPlayCombination = Math.random() > 0.5;
  const frequencies = shouldPlayCombination
    ? [getRandomFrequency(), getRandomFrequency()]
    : [getRandomFrequency()];

  const audioEvent: AudioEvent = {
    event: "audio",
    timestamp: Date.now(),
    frequencies,
    duration: 5,
  };

  io.emit("audio", audioEvent);
  console.log(
    `♪ Audio: ${frequencies.map((f) => Math.round(f)).join("Hz + ")}Hz`
  );
}

// Helper function for random frequency
function getRandomFrequency(): number {
  return Math.random() * (880 - 220) + 220; // A3 to A5
}

// Start generation scheduler
let generationInterval: NodeJS.Timeout;

function startScheduler() {
  console.log(
    `🎨 Starting generation scheduler (${GENERATION_INTERVAL}ms interval)`
  );

  // Generate first composition immediately
  setTimeout(() => {
    generateAndBroadcast();
  }, 1000);

  // Then continue on interval
  generationInterval = setInterval(() => {
    generateAndBroadcast();
  }, GENERATION_INTERVAL);
}

function stopScheduler() {
  if (generationInterval) {
    clearInterval(generationInterval);
    console.log("Scheduler stopped");
  }
}

// Start server
httpServer.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 Mondrian Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   WebSocket ready for connections`);
  console.log("=".repeat(50) + "\n");

  startScheduler();
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\nShutting down gracefully...");
  stopScheduler();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("\n\nReceived SIGTERM, shutting down...");
  stopScheduler();
  httpServer.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
