import { createCanvas, CanvasRenderingContext2D } from "canvas";
import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

// --- Configuration ---

// Standard 4K UHD resolution
const WIDTH = 3840;
const HEIGHT = 2160;

const LINE_WEIGHT = 40; // Bold black lines, relative to 4K resolution

const PRIMARY_COLORS = ["#FF0000", "#225095", "#FFFF00", "#30303a"]; // Red, Blue, Yellow
const BACKGROUND_COLOR = "#FFFFFF"; // White

const MAX_SPLIT_DEPTH = 5; // Controls the complexity of the grid
const COLOR_CHANCE = 0.3; // Chance for a block to be colored (otherwise, it's white)
const MIN_BLOCK_SIZE = 300; // Minimum dimension for a block to be split further

// --- Types ---

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Core Mondrian Generation Logic ---

/**
 * Recursively partitions a block into smaller blocks.
 * @param block The current block to split.
 * @param depth The current recursion depth.
 * @returns An array of final, non-splittable blocks.
 */
function generateBlocks(block: Block, depth: number): Block[] {
  // Stop condition 1: Max depth reached
  if (depth >= MAX_SPLIT_DEPTH) {
    return [block];
  }

  // Stop condition 2: Block is too small
  if (block.width < MIN_BLOCK_SIZE && block.height < MIN_BLOCK_SIZE) {
    return [block];
  }

  // Decide whether to split horizontally, vertically, or not at all
  // Small chance (1 in 5) not to split, creating a large block
  if (Math.random() < 0.2 && depth > 0) {
    return [block];
  }

  const splitHorizontally = block.height > block.width;
  const splitVertically = block.width > block.height;

  let blocks: Block[] = [];

  if (splitHorizontally && block.height > MIN_BLOCK_SIZE) {
    // Horizontal split
    const splitPoint = Math.floor(
      block.y + block.height * (Math.random() * 0.4 + 0.3)
    ); // 30% to 70% split
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
      ...generateBlocks(blockA, depth + 1),
      ...generateBlocks(blockB, depth + 1),
    ];
  } else if (splitVertically && block.width > MIN_BLOCK_SIZE) {
    // Vertical split
    const splitPoint = Math.floor(
      block.x + block.width * (Math.random() * 0.4 + 0.3)
    ); // 30% to 70% split
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
      ...generateBlocks(blockA, depth + 1),
      ...generateBlocks(blockB, depth + 1),
    ];
  } else {
    // If neither split is clearly preferred (e.g., a near-square block), try a random split if size permits
    if (block.width > MIN_BLOCK_SIZE && block.height > MIN_BLOCK_SIZE) {
      if (Math.random() < 0.5) {
        // Vertical split
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
          ...generateBlocks(blockA, depth + 1),
          ...generateBlocks(blockB, depth + 1),
        ];
      } else {
        // Horizontal split
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
          ...generateBlocks(blockA, depth + 1),
          ...generateBlocks(blockB, depth + 1),
        ];
      }
    } else {
      blocks = [block];
    }
  }

  return blocks;
}

/**
 * Draws the Mondrian composition onto the canvas.
 * @param ctx The canvas context.
 * @param blocks The list of blocks to draw.
 */
function drawMondrian(ctx: CanvasRenderingContext2D, blocks: Block[]): void {
  // 1. Fill blocks with colors (White or Primary)
  for (const block of blocks) {
    // Decide on color or white
    if (Math.random() < COLOR_CHANCE) {
      // Pick a random primary color
      const colorIndex = Math.floor(Math.random() * PRIMARY_COLORS.length);
      ctx.fillStyle = PRIMARY_COLORS[colorIndex];
    } else {
      // Most blocks are white
      ctx.fillStyle = BACKGROUND_COLOR;
    }

    // Fill the block area
    ctx.fillRect(block.x, block.y, block.width, block.height);
  }

  // 2. Draw the black grid over the blocks
  ctx.strokeStyle = "#000000"; // Black
  ctx.lineWidth = LINE_WEIGHT;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  for (const block of blocks) {
    // Draw the four sides of the block
    ctx.strokeRect(block.x, block.y, block.width, block.height);
  }
}

/**
 * Generates and saves a single Mondrian image.
 * @param outputFilename The name of the file to save.
 */
export async function generateMondrianImage(
  outputFilename: string
): Promise<void> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // 1. Initialize the canvas with white background
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. Generate the block structure
  const initialBlock: Block = { x: 0, y: 0, width: WIDTH, height: HEIGHT };
  const finalBlocks = generateBlocks(initialBlock, 0);

  // 3. Draw the Mondrian composition
  drawMondrian(ctx, finalBlocks);

  // 4. Save the image to file
  const buffer = canvas.toBuffer("image/png");
  await fs.promises.writeFile(outputFilename, buffer);

  console.log(`✅ Generated ${outputFilename} (${WIDTH}x${HEIGHT})`);
}

// --- CLI Logic ---

const program = new Command();

program
  .version("1.0.0")
  .description("CLI tool to generate Piet Mondrian-style 4K images.")
  .option("-a, --amount <number>", "The number of images to generate.", "1")
  .option(
    "-o, --output <dir>",
    "The output directory for the images.",
    "./output"
  )
  .action(async (options) => {
    const amount = parseInt(options.amount, 10);
    const outputDir = options.output;

    if (isNaN(amount) || amount <= 0) {
      console.error("Error: --amount must be a positive number.");
      process.exit(1);
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    console.log(`\nStarting generation of ${amount} Mondrian images...`);

    for (let i = 1; i <= amount; i++) {
      const filename = path.join(outputDir, `mondrian_${Date.now()}_${i}.png`);
      try {
        await generateMondrianImage(filename);
      } catch (error) {
        console.error(`\n❌ Failed to generate image ${i}:`, error);
      }
    }

    console.log("\n✨ Generation complete!");
  });

program.parse(process.argv);
