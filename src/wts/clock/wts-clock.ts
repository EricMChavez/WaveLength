/** Number of subdivisions per WTS cycle */
export const SUBDIVISIONS_PER_WTS = 16;

/**
 * WTS (Wire Transfer Speed) clock — pure state machine.
 * Tracks tick count and WTS cycle. No timers; caller drives ticks.
 */
export class WtsClock {
  private tickCount = 0;

  /** Advance the clock by one subdivision. */
  tick(): void {
    this.tickCount++;
  }

  /** Current absolute tick count since last reset. */
  getTick(): number {
    return this.tickCount;
  }

  /** Current subdivision within the current WTS cycle (0–15). */
  getSubdivision(): number {
    return this.tickCount % SUBDIVISIONS_PER_WTS;
  }

  /** Number of complete WTS cycles elapsed. */
  getWtsCycle(): number {
    return Math.floor(this.tickCount / SUBDIVISIONS_PER_WTS);
  }

  /** Reset to tick 0. */
  reset(): void {
    this.tickCount = 0;
  }
}
