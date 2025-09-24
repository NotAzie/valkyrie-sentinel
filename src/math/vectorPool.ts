/**
 * Zero-Allocation Vector Math Kernel.
 * Utilizes pre-allocated continuous Float64Array memory buffers to prevent GC pauses.
 */
export class VectorPool {
  private buffer: Float64Array;
  private pointer = 0;
  private readonly capacity: number;

  constructor(vectorCount = 1024) {
    this.capacity = vectorCount * 3;
    this.buffer = new Float64Array(this.capacity);
  }

  public allocate(x: number, y: number, z: number): number {
    if (this.pointer + 3 > this.capacity) {
      this.pointer = 0; // Ring buffer wrap-around
    }
    const idx = this.pointer;
    this.buffer[idx] = x;
    this.buffer[idx + 1] = y;
    this.buffer[idx + 2] = z;
    this.pointer += 3;
    return idx;
  }

  public dot(idxA: number, idxB: number): number {
    return (
      this.buffer[idxA] * this.buffer[idxB] +
      this.buffer[idxA + 1] * this.buffer[idxB + 1] +
      this.buffer[idxA + 2] * this.buffer[idxB + 2]
    );
  }

  public distance(idxA: number, idxB: number): number {
    const dx = this.buffer[idxA] - this.buffer[idxB];
    const dy = this.buffer[idxA + 1] - this.buffer[idxB + 1];
    const dz = this.buffer[idxA + 2] - this.buffer[idxB + 2];
    return Math.hypot(dx, dy, dz);
  }
}
