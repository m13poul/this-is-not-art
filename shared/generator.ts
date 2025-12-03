/**
 * Mondrian Generation Logic (Shared between client and server)
 *
 * This module contains the core algorithm for generating
 * Piet Mondrian-style compositions with deterministic output.
 */

import { SeededRandom } from "./seededRandom";
import { Block, GenerationParams } from "./types";

const PRIMARY_COLORS = ["#FF0000", "#0000FF", "#FFFF00"]; // Red, Blue, Yellow
const BACKGROUND_COLOR = "#FFFFFF"; // White
const MIN_BLOCK_SIZE = 150; // Minimum block size before stopping subdivision

/**
 * Recursively generates blocks by subdividing the canvas
 * using orthogonal (horizontal/vertical) splits
 */
export function generateBlocks(
  block: Block,
  depth: number,
  maxDepth: number,
  rng: SeededRandom
): Block[] {
  if (depth >= maxDepth) {
    return [block];
  }

  if (
    (block.width < MIN_BLOCK_SIZE && block.height < MIN_BLOCK_SIZE) ||
    (rng.next() < 0.2 && depth > 0)
  ) {
    return [block];
  }

  const splitHorizontally = block.height > block.width;
  const splitVertically = block.width > block.height;
  let blocks: Block[] = [];

  if (splitHorizontally && block.height > MIN_BLOCK_SIZE) {
    const splitPoint = Math.floor(
      block.y + block.height * (rng.next() * 0.4 + 0.3)
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
      ...generateBlocks(blockA, depth + 1, maxDepth, rng),
      ...generateBlocks(blockB, depth + 1, maxDepth, rng),
    ];
  } else if (splitVertically && block.width > MIN_BLOCK_SIZE) {
    const splitPoint = Math.floor(
      block.x + block.width * (rng.next() * 0.4 + 0.3)
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
      ...generateBlocks(blockA, depth + 1, maxDepth, rng),
      ...generateBlocks(blockB, depth + 1, maxDepth, rng),
    ];
  } else {
    blocks = [block];
  }

  return blocks;
}

/**
 * Draws the Mondrian composition onto a canvas context
 */
export function drawComposition(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  colorChance: number,
  lineWeight: number,
  rng: SeededRandom
): void {
  // Fill blocks
  for (const block of blocks) {
    if (rng.next() < colorChance) {
      const colorIndex = Math.floor(rng.next() * PRIMARY_COLORS.length);
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

/**
 * Generate complete Mondrian composition from parameters
 * This is the main entry point for both client and server
 */
export function generateMondrianComposition(
  ctx: CanvasRenderingContext2D,
  params: GenerationParams
): void {
  const rng = new SeededRandom(params.seed);

  // Clear canvas
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, params.width, params.height);

  // Generate blocks
  const initialBlock: Block = {
    x: 0,
    y: 0,
    width: params.width,
    height: params.height,
  };
  const finalBlocks = generateBlocks(initialBlock, 0, params.depth, rng);

  // Draw composition
  drawComposition(ctx, finalBlocks, params.colorChance, params.lineWeight, rng);
}

/**
 * Generate random parameters for a composition
 * Server uses this, client receives these params
 */
export function generateRandomParams(
  width: number,
  height: number
): Omit<GenerationParams, "seed" | "width" | "height"> {
  return {
    depth: Math.floor(Math.random() * 3) + 4, // 4-6
    colorChance: Math.random() * 0.2 + 0.2, // 0.2-0.4
    lineWeight: Math.floor(Math.random() * 19) + 12, // 12-30
  };
}
