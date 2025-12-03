/**
 * Mondrian Web Client - Server-Synchronized Version
 * Connects to WebSocket server and renders synchronized compositions
 */

import { MondrianSocketClient } from "./socket";
import { generateMondrianComposition, GenerationParams } from "../../shared";

// --- Tone Generator (Web Audio API) ---

class ToneGenerator {
  private audioContext: AudioContext;
  private volume: number = 0.1; // Default 10%

  constructor() {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
  }

  async init(): Promise<void> {
    // Resume the AudioContext if it's suspended
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  playTone(frequency: number, duration: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playTones(frequencies: number[], duration: number): void {
    frequencies.forEach((freq) => this.playTone(freq, duration));
    console.log(
      `♪ Playing ${frequencies.length} tone(s): ${frequencies
        .map((f) => Math.round(f))
        .join("Hz + ")}Hz`
    );
  }

  setVolume(volumePercent: number): void {
    this.volume = volumePercent / 100;
    console.log(`Volume set to ${volumePercent}%`);
  }
}

// --- Canvas Manager ---

class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Set canvas size to match window dimensions
    this.resizeCanvas();

    // Handle window resize and orientation changes
    window.addEventListener("resize", () => this.resizeCanvas());
    window.addEventListener("orientationchange", () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render(params: GenerationParams): void {
    generateMondrianComposition(this.ctx, params);
    console.log(`🎨 Rendered: seed=${params.seed}, depth=${params.depth}`);
  }

  getWidth(): number {
    return this.canvas.width;
  }

  getHeight(): number {
    return this.canvas.height;
  }
}

// --- Main Application ---

class MondrianApp {
  private socketClient: MondrianSocketClient;
  private toneGenerator: ToneGenerator;
  private canvasManager: CanvasManager;
  private isStarted: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.socketClient = new MondrianSocketClient();
    this.toneGenerator = new ToneGenerator();
    this.canvasManager = new CanvasManager(canvas);

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Handle generation events from server
    this.socketClient.onGenerate((event) => {
      if (!this.isStarted) return;

      const params: GenerationParams = {
        seed: event.seed,
        depth: event.depth,
        colorChance: event.colorChance,
        lineWeight: event.lineWeight,
        width: this.canvasManager.getWidth(),
        height: this.canvasManager.getHeight(),
      };

      this.canvasManager.render(params);
    });

    // Handle audio events from server
    this.socketClient.onAudio((event) => {
      if (!this.isStarted) return;
      this.toneGenerator.playTones(event.frequencies, event.duration);
    });

    // Handle user count updates
    this.socketClient.onUserCount((count) => {
      console.log(`👥 ${count} user(s) online`);
      this.updateUserCount(count);
    });

    // Handle connection status
    this.socketClient.onConnection((connected) => {
      if (connected) {
        console.log("✓ Connected to synchronization server");
        this.showConnectionStatus("Connected", true);
      } else {
        console.log("✗ Disconnected from server");
        this.showConnectionStatus("Disconnected", false);
      }
    });
  }

  async start(): Promise<void> {
    await this.toneGenerator.init();
    this.socketClient.connect();
    this.isStarted = true;
    console.log("🚀 Mondrian app started - waiting for server events");
  }

  setVolume(volumePercent: number): void {
    this.toneGenerator.setVolume(volumePercent);
  }

  private updateUserCount(count: number): void {
    const userCountEl = document.getElementById("userCount");
    if (userCountEl) {
      userCountEl.textContent = `${count} user${count !== 1 ? "s" : ""} online`;
    }
  }

  private showConnectionStatus(status: string, connected: boolean): void {
    const statusEl = document.getElementById("connectionStatus");
    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = connected ? "connected" : "disconnected";
    }
  }
}

// --- Main execution ---
window.addEventListener("load", () => {
  const canvas = document.getElementById("mondrianCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  const app = new MondrianApp(canvas);

  // Setup start button
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", () => {
      app.start();
      startButton.style.display = "none";
    });
  }

  // Setup volume control
  const volumeSlider = document.getElementById(
    "volumeSlider"
  ) as HTMLInputElement;
  const volumeValue = document.getElementById("volumeValue");
  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener("input", () => {
      const volume = parseInt(volumeSlider.value, 10);
      volumeValue.textContent = `${volume}%`;
      app.setVolume(volume);
    });
  }

  // Speed control is now server-controlled, so hide it or make it read-only
  const speedControl = document.getElementById("speedControl");
  if (speedControl) {
    speedControl.style.display = "none";
  }

  // Auto-hide controls after 3 seconds of mouse inactivity
  const controls = document.getElementById("controls");
  let hideTimeout: number | null = null;
  let autoHideEnabled = false;

  const showControls = () => {
    if (controls && autoHideEnabled) {
      controls.classList.remove("hidden");

      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
      }

      hideTimeout = window.setTimeout(() => {
        controls.classList.add("hidden");
      }, 3000);
    }
  };

  // Enable auto-hide when user clicks start
  if (startButton) {
    startButton.addEventListener("click", () => {
      if (controls) {
        controls.classList.add("hidden");
      }
      autoHideEnabled = true;
    });
  }

  document.addEventListener("mousemove", showControls);

  if (controls) {
    controls.addEventListener("mouseenter", () => {
      if (autoHideEnabled && hideTimeout !== null) {
        clearTimeout(hideTimeout);
      }
    });

    controls.addEventListener("mouseleave", () => {
      if (autoHideEnabled) {
        hideTimeout = window.setTimeout(() => {
          controls.classList.add("hidden");
        }, 3000);
      }
    });
  }
});
