/**
 * Bit-Packed Flat State Buffer.
 * Zero-copy binary serialization representing 500 entity states in a single ArrayBuffer.
 */
export class FlatStateBuffer {
  private buffer: ArrayBuffer;
  private floatView: Float32Array;
  private intView: Int32Array;
  private readonly stride = 8; // 8 x 4 bytes = 32 bytes per entity record

  constructor(maxEntities = 512) {
    this.buffer = new ArrayBuffer(maxEntities * 32);
    this.floatView = new Float32Array(this.buffer);
    this.intView = new Int32Array(this.buffer);
  }

  public writeEntity(
    index: number,
    id: number,
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number
  ): void {
    const offset = index * this.stride;
    this.intView[offset] = id;
    this.floatView[offset + 1] = x;
    this.floatView[offset + 2] = y;
    this.floatView[offset + 3] = z;
    this.floatView[offset + 4] = vx;
    this.floatView[offset + 5] = vy;
    this.floatView[offset + 6] = vz;
  }

  public getRawBuffer(): ArrayBuffer {
    return this.buffer;
  }
}
