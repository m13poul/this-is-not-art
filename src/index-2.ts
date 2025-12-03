import { createCanvas, CanvasRenderingContext2D } from "canvas";
import * as fs from "fs";
import * as path from "path";
import { Command } from "commander";

// --- Global Fixed Configuration (Mondrian Style) ---

// Standard 4K UHD resolution
const WIDTH = 3840;
const HEIGHT = 2160;

const PRIMARY_COLORS = ["#FF0000", "#0000FF", "#FFFF00"]; // Red, Blue, Yellow
const BACKGROUND_COLOR = "#FFFFFF"; // White
const MIN_BLOCK_SIZE = 300;

// --- Types ---

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
}

// --- Core Generation Logic (Orthogonal Grid) ---

/**
 * Recursively partitions a block into smaller orthogonal blocks.
 */
function generateBlocks(
  block: Block,
  depth: number,
  maxDepth: number
): Block[] {
  // Stop condition 1: Max depth reached
  if (depth >= maxDepth) {
    return [block];
  }

  // Stop condition 2: Block is too small or randomly stops splitting
  if (
    (block.width < MIN_BLOCK_SIZE && block.height < MIN_BLOCK_SIZE) ||
    (Math.random() < 0.2 && depth > 0)
  ) {
    return [block];
  }

  // Split logic remains the same (favoring the longest side, random split point)
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

/**
 * Fills blocks and draws the orthogonal black grid lines.
 */
function drawComposition(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  colorChance: number,
  lineWeight: number
): void {
  // 1. Fill blocks with colors (White or Primary)
  for (const block of blocks) {
    if (Math.random() < colorChance) {
      const colorIndex = Math.floor(Math.random() * PRIMARY_COLORS.length);
      ctx.fillStyle = PRIMARY_COLORS[colorIndex];
    } else {
      ctx.fillStyle = BACKGROUND_COLOR;
    }

    ctx.fillRect(block.x, block.y, block.width, block.height);
  }

  // 2. Draw the black grid over the blocks
  ctx.strokeStyle = "#000000"; // Black
  ctx.lineWidth = lineWeight;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";

  for (const block of blocks) {
    ctx.strokeRect(block.x, block.y, block.width, block.height);
  }
}

/**
 * Generates and saves a single Mondrian image.
 */
export async function generateArtImage(
  outputFilename: string,
  maxDepth: number,
  colorChance: number,
  lineWeight: number
): Promise<void> {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // 1. Initialize the canvas with white background
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 2. Generate the block structure
  const initialBlock: Block = { x: 0, y: 0, width: WIDTH, height: HEIGHT };
  const finalBlocks = generateBlocks(initialBlock, 0, maxDepth);

  // 3. Draw the Mondrian composition
  drawComposition(ctx, finalBlocks, colorChance, lineWeight);

  // 4. Save the image to file
  const buffer = canvas.toBuffer("image/png");
  await fs.promises.writeFile(outputFilename, buffer);

  console.log(
    `✅ Generated ${outputFilename} (Depth: ${maxDepth}, ColorChance: ${colorChance.toFixed(
      2
    )}, LineWeight: ${lineWeight}px)`
  );
}

// --- CLI Logic ---

// Helper function to generate a random integer within a range
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
// Helper function to generate a random float within a range
const randFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const program = new Command();

program
  .version("1.0.0")
  .description(
    "CLI tool to generate configurable Piet Mondrian-style 4K images."
  )
  .option("-a, --amount <number>", "The number of images to generate.", "1")
  .option(
    "-o, --output <dir>",
    "The output directory for the images.",
    "./output"
  )
  .option(
    "-d, --depth <number>",
    "Max split depth (complexity). Default: random [4-6]."
  )
  .option(
    "-c, --color-chance <number>",
    "Probability (0.0 to 1.0) a block is colored. Default: random [0.2-0.4]."
  )
  .option(
    "-l, --line-weight <number>",
    "The thickness of the black lines (in pixels). Default: random [25-60]."
  )
  .action(async (options) => {
    const amount = parseInt(options.amount, 10);
    const outputDir = options.output;

    if (isNaN(amount) || amount <= 0) {
      console.error("Error: --amount must be a positive number.");
      process.exit(1);
    }

    // Parse CLI arguments once
    const MAX_DEPTH_CLI = options.depth ? parseInt(options.depth, 10) : null;
    const COLOR_CHANCE_CLI = options.colorChance
      ? parseFloat(options.colorChance)
      : null;
    const LINE_WEIGHT_CLI = options.lineWeight
      ? parseInt(options.lineWeight, 10)
      : null;

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    console.log(`\nStarting generation of ${amount} Mondrian images...`);

    for (let i = 1; i <= amount; i++) {
      // --- Configuration Logic: Determine parameters for THIS image ---

      // 1. Max Split Depth: Use CLI value if provided, otherwise random.
      let maxDepth =
        MAX_DEPTH_CLI && MAX_DEPTH_CLI > 0 ? MAX_DEPTH_CLI : randInt(4, 6);

      // 2. Color Chance: Use CLI value if provided, otherwise random.
      let colorChance =
        COLOR_CHANCE_CLI !== null ? COLOR_CHANCE_CLI : randFloat(0.2, 0.4);
      colorChance = Math.min(1.0, Math.max(0.0, colorChance)); // Sanity check

      // 3. Line Weight: Use CLI value if provided, otherwise random.
      let lineWeight =
        LINE_WEIGHT_CLI && LINE_WEIGHT_CLI > 5
          ? LINE_WEIGHT_CLI
          : randInt(25, 60);
      lineWeight = Math.max(5, lineWeight); // Enforce a minimum thickness

      // --- End Configuration Logic ---

      const filename = path.join(outputDir, `mondrian_${Date.now()}_${i}.png`);
      try {
        // Pass the unique set of parameters for this image generation
        await generateArtImage(filename, maxDepth, colorChance, lineWeight);
      } catch (error) {
        console.error(`\n❌ Failed to generate image ${i}:`, error);
      }
    }

    console.log("\n✨ Generation complete!");
  });

program.parse(process.argv);
