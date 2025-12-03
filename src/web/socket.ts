/**
 * WebSocket Connection Module
 * Handles communication with the Mondrian synchronization server
 */

import { io, Socket } from "socket.io-client";
import {
  GenerationEvent,
  AudioEvent,
  WelcomeEvent,
  UserCountEvent,
  SyncEvent,
  JoinEvent,
  SyncRequestEvent,
} from "../../shared";

// Server URL - change for production
const SERVER_URL = "http://192.168.1.95:3001";

export class MondrianSocketClient {
  private socket: Socket | null = null;
  private clientId: string | null = null;
  private clockOffset: number = 0; // Difference between server and client time
  private onGenerateCallback: ((event: GenerationEvent) => void) | null = null;
  private onAudioCallback: ((event: AudioEvent) => void) | null = null;
  private onUserCountCallback: ((count: number) => void) | null = null;
  private onConnectionCallback: ((connected: boolean) => void) | null = null;

  constructor() {}

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    console.log(`Connecting to server: ${SERVER_URL}`);

    this.socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    // Connection established
    this.socket.on("connect", () => {
      console.log("✓ Connected to server");
      if (this.onConnectionCallback) {
        this.onConnectionCallback(true);
      }

      // Send join event
      const joinEvent: JoinEvent = {
        event: "join",
        userAgent: navigator.userAgent,
      };
      this.socket?.emit("join", joinEvent);

      // Request initial time sync
      this.requestTimeSync();

      // Periodic time sync every 30 seconds
      setInterval(() => this.requestTimeSync(), 30000);
    });

    // Welcome message
    this.socket.on("welcome", (data: WelcomeEvent) => {
      console.log(`Welcome! Client ID: ${data.clientId}`);
      this.clientId = data.clientId;

      // Calculate initial clock offset
      const now = Date.now();
      this.clockOffset = data.serverTime - now;
      console.log(`Initial clock offset: ${this.clockOffset}ms`);
    });

    // Generation event
    this.socket.on("generate", (data: GenerationEvent) => {
      console.log(
        `Received generation: seed=${data.seed}, depth=${data.depth}`
      );
      if (this.onGenerateCallback) {
        this.onGenerateCallback(data);
      }
    });

    // Audio event
    this.socket.on("audio", (data: AudioEvent) => {
      console.log(`Received audio: ${data.frequencies.length} tones`);
      if (this.onAudioCallback) {
        this.onAudioCallback(data);
      }
    });

    // User count update
    this.socket.on("users", (data: UserCountEvent) => {
      console.log(`Users online: ${data.count}`);
      if (this.onUserCountCallback) {
        this.onUserCountCallback(data.count);
      }
    });

    // Time sync response
    this.socket.on("sync", (data: SyncEvent) => {
      const now = Date.now();
      const rtt = now - data.clientTime; // Round-trip time
      this.clockOffset = data.serverTime - (data.clientTime + rtt / 2);
      console.log(`Clock sync: offset=${this.clockOffset}ms, RTT=${rtt}ms`);
    });

    // Disconnection
    this.socket.on("disconnect", () => {
      console.log("✗ Disconnected from server");
      if (this.onConnectionCallback) {
        this.onConnectionCallback(false);
      }
    });

    // Connection error
    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
    });
  }

  /**
   * Request time synchronization with server
   */
  private requestTimeSync(): void {
    if (!this.socket) return;

    const syncRequest: SyncRequestEvent = {
      event: "sync_request",
      clientTime: Date.now(),
    };
    this.socket.emit("sync_request", syncRequest);
  }

  /**
   * Get server time adjusted for clock offset
   */
  getServerTime(): number {
    return Date.now() + this.clockOffset;
  }

  /**
   * Register callback for generation events
   */
  onGenerate(callback: (event: GenerationEvent) => void): void {
    this.onGenerateCallback = callback;
  }

  /**
   * Register callback for audio events
   */
  onAudio(callback: (event: AudioEvent) => void): void {
    this.onAudioCallback = callback;
  }

  /**
   * Register callback for user count updates
   */
  onUserCount(callback: (count: number) => void): void {
    this.onUserCountCallback = callback;
  }

  /**
   * Register callback for connection status changes
   */
  onConnection(callback: (connected: boolean) => void): void {
    this.onConnectionCallback = callback;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
