"use strict";
(() => {
  // src/web/main.ts
  var PRIMARY_COLORS = ["#FF0000", "#0000FF", "#FFFF00"];
  var BACKGROUND_COLOR = "#FFFFFF";
  var MIN_BLOCK_SIZE = 150;
  function generateBlocks(block, depth, maxDepth) {
    if (depth >= maxDepth) {
      return [block];
    }
    if (block.width < MIN_BLOCK_SIZE && block.height < MIN_BLOCK_SIZE || Math.random() < 0.2 && depth > 0) {
      return [block];
    }
    const splitHorizontally = block.height > block.width;
    const splitVertically = block.width > block.height;
    let blocks = [];
    if (splitHorizontally && block.height > MIN_BLOCK_SIZE) {
      const splitPoint = Math.floor(
        block.y + block.height * (Math.random() * 0.4 + 0.3)
      );
      const blockA = {
        x: block.x,
        y: block.y,
        width: block.width,
        height: splitPoint - block.y
      };
      const blockB = {
        x: block.x,
        y: splitPoint,
        width: block.width,
        height: block.y + block.height - splitPoint
      };
      blocks = [
        ...generateBlocks(blockA, depth + 1, maxDepth),
        ...generateBlocks(blockB, depth + 1, maxDepth)
      ];
    } else if (splitVertically && block.width > MIN_BLOCK_SIZE) {
      const splitPoint = Math.floor(
        block.x + block.width * (Math.random() * 0.4 + 0.3)
      );
      const blockA = {
        x: block.x,
        y: block.y,
        width: splitPoint - block.x,
        height: block.height
      };
      const blockB = {
        x: splitPoint,
        y: block.y,
        width: block.x + block.width - splitPoint,
        height: block.height
      };
      blocks = [
        ...generateBlocks(blockA, depth + 1, maxDepth),
        ...generateBlocks(blockB, depth + 1, maxDepth)
      ];
    } else {
      blocks = [block];
    }
    return blocks;
  }
  function drawComposition(ctx, blocks, colorChance, lineWeight) {
    for (const block of blocks) {
      if (Math.random() < colorChance) {
        const colorIndex = Math.floor(Math.random() * PRIMARY_COLORS.length);
        ctx.fillStyle = PRIMARY_COLORS[colorIndex];
      } else {
        ctx.fillStyle = BACKGROUND_COLOR;
      }
      ctx.fillRect(block.x, block.y, block.width, block.height);
    }
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = lineWeight;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    for (const block of blocks) {
      ctx.strokeRect(block.x, block.y, block.width, block.height);
    }
  }
  var randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  var randFloat = (min, max) => Math.random() * (max - min) + min;
  var ToneGenerator = class {
    // Default 5 seconds
    constructor(canvas) {
      this.isRunning = false;
      this.intervalId = null;
      this.volume = 0.1;
      // Default 40%
      this.interval = 1e3;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.canvas.width = 1920;
      this.canvas.height = 1080;
    }
    generateMondrianImage() {
      const maxDepth = randInt(4, 6);
      const colorChance = randFloat(0.2, 0.4);
      const lineWeight = randInt(12, 30);
      this.ctx.fillStyle = BACKGROUND_COLOR;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const initialBlock = {
        x: 0,
        y: 0,
        width: this.canvas.width,
        height: this.canvas.height
      };
      const finalBlocks = generateBlocks(initialBlock, 0, maxDepth);
      drawComposition(this.ctx, finalBlocks, colorChance, lineWeight);
    }
    playTone(frequency, duration) {
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
    playCombinationOfTones(duration) {
      const frequencies = [this.getRandomFrequency(), this.getRandomFrequency()];
      console.log(
        `Playing combination of tones at ~${Math.round(
          frequencies[0]
        )}Hz and ~${Math.round(frequencies[1])}Hz`
      );
      frequencies.forEach((freq) => this.playTone(freq, duration));
    }
    getRandomFrequency() {
      return Math.random() * (880 - 220) + 220;
    }
    generateSoundAndImage() {
      this.generateMondrianImage();
      const shouldPlayCombination = Math.random() > 0.5;
      if (shouldPlayCombination) {
        this.playCombinationOfTones(5);
      } else {
        const freq = this.getRandomFrequency();
        console.log(`Playing single tone at ~${Math.round(freq)}Hz`);
        this.playTone(freq, 5);
      }
    }
    setVolume(volumePercent) {
      this.volume = volumePercent / 100;
      console.log(`Volume set to ${volumePercent}%`);
    }
    setInterval(seconds) {
      this.interval = seconds * 1e3;
      console.log(`Speed set to ${seconds} seconds`);
      if (this.isRunning && this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = window.setInterval(
          () => this.generateSoundAndImage(),
          this.interval
        );
      }
    }
    async start() {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      if (this.isRunning) return;
      this.isRunning = true;
      console.log(
        `Audio and visual engine started. Generating every ${this.interval / 1e3} seconds.`
      );
      this.generateSoundAndImage();
      this.intervalId = window.setInterval(
        () => this.generateSoundAndImage(),
        this.interval
      );
    }
    stop() {
      if (!this.isRunning || this.intervalId === null) return;
      this.isRunning = false;
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Audio engine stopped.");
    }
  };
  window.addEventListener("load", () => {
    const canvas = document.getElementById("mondrianCanvas");
    if (!canvas) {
      console.error("Canvas element not found!");
      return;
    }
    const toneGenerator = new ToneGenerator(canvas);
    const startButton = document.getElementById("startButton");
    if (startButton) {
      startButton.addEventListener("click", () => {
        toneGenerator.start();
        startButton.style.display = "none";
      });
    }
    const volumeSlider = document.getElementById(
      "volumeSlider"
    );
    const volumeValue = document.getElementById("volumeValue");
    if (volumeSlider && volumeValue) {
      volumeSlider.addEventListener("input", () => {
        const volume = parseInt(volumeSlider.value, 10);
        volumeValue.textContent = `${volume}%`;
        toneGenerator.setVolume(volume);
      });
    }
    const speedSlider = document.getElementById(
      "speedSlider"
    );
    const speedValue = document.getElementById("speedValue");
    if (speedSlider && speedValue) {
      speedSlider.addEventListener("input", () => {
        const speed = parseFloat(speedSlider.value);
        speedValue.textContent = `${speed.toFixed(1)}s`;
        toneGenerator.setInterval(speed);
      });
    }
  });
})();
//# sourceMappingURL=bundle.js.map
