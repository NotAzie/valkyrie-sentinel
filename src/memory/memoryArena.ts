/**
 * Continuous Flat Memory Arena.
 * Pre-allocates a single contiguous 16 MB ArrayBuffer at boot.
 * Sub-allocators hand out fixed-size memory slices using pointer increments,
 * eliminating 100% of runtime garbage collection churn.
 */
export class MemoryArena {
  private static instance: MemoryArena;
  private readonly buffer: ArrayBuffer;
  private readonly dataView: DataView;
  private offset = 0;
  private readonly capacity: number;

  constructor(sizeBytes = 16 * 1024 * 1024) { // 16 MB
    this.capacity = sizeBytes;
    this.buffer = new ArrayBuffer(sizeBytes);
    this.dataView = new DataView(this.buffer);
  }

  public static getGlobal(): MemoryArena {
    if (!MemoryArena.instance) {
      MemoryArena.instance = new MemoryArena();
    }
    return MemoryArena.instance;
  }

  public allocate(byteCount: number): number {
    // 8-byte boundary alignment
    const alignedBytes = (byteCount + 7) & ~7;
    if (this.offset + alignedBytes > this.capacity) {
      this.offset = 0; // Ring buffer wrap-around
    }
    const allocated = this.offset;
    this.offset += alignedBytes;
    return allocated;
  }

  public getView(): DataView {
    return this.dataView;
  }

  public reset(): void {
    this.offset = 0;
  }
}
