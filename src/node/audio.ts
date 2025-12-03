import * as fs from "fs";
import * as wav from "wav";
import player from "play-sound";

class ToneGenerator {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private audioPlayer = player({});
  private readonly sampleRate = 44100;
  private readonly duration = 5; // seconds
  private readonly tempFilePath = "temp_tone.wav";

  private generatePCM(frequencies: number[]): Buffer {
    const numSamples = this.sampleRate * this.duration;
    const buffer = Buffer.alloc(numSamples * 2); // 16-bit samples

    for (let i = 0; i < numSamples; i++) {
      let sample = 0;
      for (const frequency of frequencies) {
        sample += Math.sin((2 * Math.PI * i * frequency) / this.sampleRate);
      }
      // Average the samples and apply some gain
      const amplitude = (sample / frequencies.length) * 16383; // Max amplitude for 16-bit audio is 32767

      buffer.writeInt16LE(amplitude, i * 2);
    }

    return buffer;
  }

  private createWavFile(pcmData: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileWriter = new wav.Writer({
        channels: 1,
        sampleRate: this.sampleRate,
        bitDepth: 16,
      });

      const fileStream = fs.createWriteStream(this.tempFilePath);
      fileWriter.pipe(fileStream);
      fileWriter.write(pcmData);
      fileWriter.end(() => resolve());

      fileStream.on("error", (err) => reject(err));
    });
  }

  private async playTone(frequencies: number[]): Promise<void> {
    const pcmData = this.generatePCM(frequencies);
    await this.createWavFile(pcmData);

    this.audioPlayer.play(this.tempFilePath, (err) => {
      if (err) {
        console.error("Failed to play sound:", err);
      }
      fs.unlinkSync(this.tempFilePath); // Clean up the temporary file
    });
  }

  private getRandomFrequency(): number {
    return Math.random() * (880 - 220) + 220; // A3 to A5
  }

  private generateSound(): void {
    const shouldPlayCombination = Math.random() > 0.5;
    let frequencies: number[];

    if (shouldPlayCombination) {
      console.log("Playing a combination of tones...");
      frequencies = [this.getRandomFrequency(), this.getRandomFrequency()];
    } else {
      console.log("Playing a single tone...");
      frequencies = [this.getRandomFrequency()];
    }
    this.playTone(frequencies);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Starting tone generator... Press Ctrl+C to stop.");
    this.generateSound(); // Play the first tone immediately
    this.intervalId = setInterval(() => this.generateSound(), 5000);
  }

  public stop(): void {
    if (!this.isRunning || this.intervalId === null) return;
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    console.log("\nStopping tone generator.");
  }
}

const toneGenerator = new ToneGenerator();
toneGenerator.start();

process.on("SIGINT", () => {
  toneGenerator.stop();
  process.exit();
});
