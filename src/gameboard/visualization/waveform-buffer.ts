/**
 * Circular buffer for storing rolling waveform data.
 * Holds the N most recent signal values for display at connection points.
 */
export class WaveformBuffer {
  readonly capacity: number;
  private readonly data: number[];
  private head = 0;
  private count = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.data = new Array<number>(capacity).fill(0);
  }

  /** Push a new value into the buffer. Overwrites the oldest value when full. */
  push(value: number): void {
    this.data[this.head] = value;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /** Number of values currently stored. */
  length(): number {
    return this.count;
  }

  /**
   * Read values in chronological order (oldest first).
   * Returns an array of length <= capacity.
   */
  toArray(): number[] {
    if (this.count < this.capacity) {
      return this.data.slice(0, this.count);
    }
    // Buffer is full — read from head (oldest) wrapping around
    return [
      ...this.data.slice(this.head),
      ...this.data.slice(0, this.head),
    ];
  }

  /** Reset the buffer to empty state. */
  clear(): void {
    this.data.fill(0);
    this.head = 0;
    this.count = 0;
  }
}
