/**
 * Seeded Random Number Generator
 *
 * Uses Linear Congruential Generator (LCG) algorithm
 * to provide deterministic pseudo-random numbers.
 *
 * Given the same seed, this will always produce the same
 * sequence of random numbers, which is critical for
 * synchronized client-side rendering.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 233280;
    if (this.seed <= 0) this.seed += 233280;
  }

  /**
   * Generate next random number between 0 and 1 (exclusive)
   */
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generate random integer between min (inclusive) and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Get current seed value (useful for debugging)
   */
  getSeed(): number {
    return this.seed;
  }
}
