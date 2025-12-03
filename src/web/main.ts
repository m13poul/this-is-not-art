// --- Mondrian Generation Logic (Browser-compatible) ---

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PRIMARY_COLORS = ["#FF0000", "#0000FF", "#FFFF00"]; // Red, Blue, Yellow
const BACKGROUND_COLOR = "#FFFFFF"; // White
const MIN_BLOCK_SIZE = 150; // Adjusted for smaller web canvas

function generateBlocks(
  block: Block,
  depth: number,
  maxDepth: number
): Block[] {
  if (depth >= maxDepth) {
    return [block];
  }

  if (
    (block.width < MIN_BLOCK_SIZE && block.height < MIN_BLOCK_SIZE) ||
    (Math.random() < 0.2 && depth > 0)
  ) {
    return [block];
  }

  const splitHorizontally = block.height > block.width;
  const splitVertically = block.width > block.height;
  let blocks: Block[] = [];

  if (splitHorizontally && block.height > MIN_BLOCK_SIZE) {
    const splitPoint = Math.floor(
      block.y + block.height * (Math.random() * 0.4 + 0.3)
    );
    const blockA: Block = {
      x: block.x,
      y: block.y,
      width: block.width,
      height: splitPoint - block.y,
    };
    const blockB: Block = {
      x: block.x,
      y: splitPoint,
      width: block.width,
      height: block.y + block.height - splitPoint,
    };

    blocks = [
      ...generateBlocks(blockA, depth + 1, maxDepth),
      ...generateBlocks(blockB, depth + 1, maxDepth),
    ];
  } else if (splitVertically && block.width > MIN_BLOCK_SIZE) {
    const splitPoint = Math.floor(
      block.x + block.width * (Math.random() * 0.4 + 0.3)
    );
    const blockA: Block = {
      x: block.x,
      y: block.y,
      width: splitPoint - block.x,
      height: block.height,
    };
    const blockB: Block = {
      x: splitPoint,
      y: block.y,
      width: block.x + block.width - splitPoint,
      height: block.height,
    };

    blocks = [
      ...generateBlocks(blockA, depth + 1, maxDepth),
      ...generateBlocks(blockB, depth + 1, maxDepth),
    ];
  } else {
    blocks = [block];
  }

  return blocks;
}

function drawComposition(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  colorChance: number,
  lineWeight: number
): void {
  // Fill blocks
  for (const block of blocks) {
    if (Math.random() < colorChance) {
      const colorIndex = Math.floor(Math.random() * PRIMARY_COLORS.length);
      ctx.fillStyle = PRIMARY_COLORS[colorIndex];
    } else {
      ctx.fillStyle = BACKGROUND_COLOR;
    }
    ctx.fillRect(block.x, block.y, block.width, block.height);
  }

  // Draw grid
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = lineWeight;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  for (const block of blocks) {
    ctx.strokeRect(block.x, block.y, block.width, block.height);
  }
}

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;

// --- Tone Generator with Mondrian Sync ---

class ToneGenerator {
  private audioContext: AudioContext;
  private isRunning: boolean = false;
  private intervalId: number | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private volume: number = 0.1; // Default 40%
  private interval: number = 1000; // Default 5 seconds

  constructor(canvas: HTMLCanvasElement) {
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    // Set canvas size
    this.canvas.width = 1920;
    this.canvas.height = 1080;
  }

  private generateMondrianImage(): void {
    const maxDepth = randInt(4, 6);
    const colorChance = randFloat(0.2, 0.4);
    const lineWeight = randInt(12, 30);

    // Clear canvas
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Generate blocks
    const initialBlock: Block = {
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height,
    };
    const finalBlocks = generateBlocks(initialBlock, 0, maxDepth);

    // Draw composition
    drawComposition(this.ctx, finalBlocks, colorChance, lineWeight);
  }

  private playTone(frequency: number, duration: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      frequency,
      this.audioContext.currentTime
    );

    // Use the volume property
    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playCombinationOfTones(duration: number): void {
    const frequencies = [this.getRandomFrequency(), this.getRandomFrequency()];
    console.log(
      `Playing combination of tones at ~${Math.round(
        frequencies[0]
      )}Hz and ~${Math.round(frequencies[1])}Hz`
    );
    frequencies.forEach((freq) => this.playTone(freq, duration));
  }

  private getRandomFrequency(): number {
    // Frequency range from A3 (220 Hz) to A5 (880 Hz)
    return Math.random() * (880 - 220) + 220;
  }

  private generateSoundAndImage(): void {
    // Generate new Mondrian image
    this.generateMondrianImage();

    // Play sound
    const shouldPlayCombination = Math.random() > 0.5;
    if (shouldPlayCombination) {
      this.playCombinationOfTones(5);
    } else {
      const freq = this.getRandomFrequency();
      console.log(`Playing single tone at ~${Math.round(freq)}Hz`);
      this.playTone(freq, 5);
    }
  }

  public setVolume(volumePercent: number): void {
    // Convert percentage (0-100) to gain value (0-1)
    this.volume = volumePercent / 100;
    console.log(`Volume set to ${volumePercent}%`);
  }

  public setInterval(seconds: number): void {
    this.interval = seconds * 1000; // Convert to milliseconds
    console.log(`Speed set to ${seconds} seconds`);

    // If already running, restart the interval with new timing
    if (this.isRunning && this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = window.setInterval(
        () => this.generateSoundAndImage(),
        this.interval
      );
    }
  }

  public async start(): Promise<void> {
    // Resume the AudioContext if it's suspended (which it will be on page load)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    if (this.isRunning) return;
    this.isRunning = true;
    console.log(
      `Audio and visual engine started. Generating every ${
        this.interval / 1000
      } seconds.`
    );

    this.generateSoundAndImage(); // Play the first tone and show first image immediately
    this.intervalId = window.setInterval(
      () => this.generateSoundAndImage(),
      this.interval
    );
  }

  public stop(): void {
    if (!this.isRunning || this.intervalId === null) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    console.log("Audio engine stopped.");
  }
}

// --- Main execution ---
window.addEventListener("load", () => {
  const canvas = document.getElementById("mondrianCanvas") as HTMLCanvasElement;
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }

  const toneGenerator = new ToneGenerator(canvas);

  // Setup start button
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", () => {
      toneGenerator.start();
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
      toneGenerator.setVolume(volume);
    });
  }

  // Setup speed control
  const speedSlider = document.getElementById(
    "speedSlider"
  ) as HTMLInputElement;
  const speedValue = document.getElementById("speedValue");
  if (speedSlider && speedValue) {
    speedSlider.addEventListener("input", () => {
      const speed = parseFloat(speedSlider.value);
      speedValue.textContent = `${speed.toFixed(1)}s`;
      toneGenerator.setInterval(speed);
    });
  }

  // Auto-hide controls after 3 seconds of mouse inactivity
  const controls = document.getElementById("controls");
  let hideTimeout: number | null = null;

  const showControls = () => {
    if (controls) {
      controls.classList.remove("hidden");

      // Clear existing timeout
      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
      }

      // Set new timeout to hide after 3 seconds
      hideTimeout = window.setTimeout(() => {
        controls.classList.add("hidden");
      }, 3000);
    }
  };

  // Show controls on mouse move
  document.addEventListener("mousemove", showControls);

  // Keep controls visible when mouse is over them
  if (controls) {
    controls.addEventListener("mouseenter", () => {
      if (hideTimeout !== null) {
        clearTimeout(hideTimeout);
      }
    });

    controls.addEventListener("mouseleave", () => {
      hideTimeout = window.setTimeout(() => {
        controls.classList.add("hidden");
      }, 3000);
    });
  }

  // Initially show controls
  showControls();
});
