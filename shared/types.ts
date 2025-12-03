/**
 * Shared types for client-server communication
 */

// ===== Server → Client Events =====

export interface GenerationEvent {
  event: "generate";
  timestamp: number; // Server timestamp (ms)
  seed: number; // Random seed for deterministic generation
  depth: number; // Recursion depth (4-6)
  colorChance: number; // Probability of colored block (0.2-0.4)
  lineWeight: number; // Thickness of black lines (12-30px)
  duration: number; // How long this composition should display (ms)
}

export interface AudioEvent {
  event: "audio";
  timestamp: number; // Server timestamp (ms)
  frequencies: number[]; // Array of Hz values to play
  duration: number; // Tone duration in seconds
}

export interface SyncEvent {
  event: "sync";
  serverTime: number; // Current server time (ms)
  clientTime: number; // Echo of client's request time
}

export interface UserCountEvent {
  event: "users";
  count: number; // Number of connected users
}

export interface WelcomeEvent {
  event: "welcome";
  clientId: string; // Assigned client ID
  serverTime: number; // Initial server time
}

// Union type of all server events
export type ServerEvent =
  | GenerationEvent
  | AudioEvent
  | SyncEvent
  | UserCountEvent
  | WelcomeEvent;

// ===== Client → Server Events =====

export interface JoinEvent {
  event: "join";
  userAgent?: string; // Optional browser info
}

export interface SyncRequestEvent {
  event: "sync_request";
  clientTime: number; // Client timestamp for RTT calculation
}

export interface DisconnectEvent {
  event: "disconnect";
}

// Union type of all client events
export type ClientEvent = JoinEvent | SyncRequestEvent | DisconnectEvent;

// ===== Mondrian Generation Types =====

export interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GenerationParams {
  seed: number;
  depth: number;
  colorChance: number;
  lineWeight: number;
  width: number;
  height: number;
}

// ===== Configuration =====

export interface ServerConfig {
  generationInterval: number; // ms between generations
  port: number;
  maxClients: number;
  syncInterval: number; // ms between sync broadcasts
}

export interface ClientConfig {
  serverUrl: string;
  autoReconnect: boolean;
  reconnectDelay: number; // ms
  debugMode: boolean;
}
