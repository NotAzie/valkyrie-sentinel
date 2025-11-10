/**
 * 64-bit Morton (Z-Order) Bitboard Spatial Lattice.
 * Maps 3D voxel coordinates into single 64-bit unsigned integers via bit interleaving.
 * Enables O(1) collision queries and 4x4x4 voxel masking via single bitwise AND operations.
 */
export class MortonLattice {
  private static readonly BITS_10 = 0x3ff; // 10 bits per axis -> 1024x1024x1024 space

  public static spreadBits(x: number): bigint {
    let n = BigInt(x & MortonLattice.BITS_10);
    n = (n | (n << 16n)) & 0x030000FFn;
    n = (n | (n << 8n))  & 0x0300F00Fn;
    n = (n | (n << 4n))  & 0x030C30C3n;
    n = (n | (n << 2n))  & 0x09249249n;
    return n;
  }

  public static compactBits(m: bigint): number {
    let n = m & 0x09249249n;
    n = (n | (n >> 2n))  & 0x030C30C3n;
    n = (n | (n >> 4n))  & 0x0300F00Fn;
    n = (n | (n >> 8n))  & 0x030000FFn;
    n = (n | (n >> 16n)) & BigInt(MortonLattice.BITS_10);
    return Number(n);
  }

  public static encode(x: number, y: number, z: number): bigint {
    const sx = this.spreadBits(x);
    const sy = this.spreadBits(y);
    const sz = this.spreadBits(z);
    return sx | (sy << 1n) | (sz << 2n);
  }

  public static decode(morton: bigint): { x: number; y: number; z: number } {
    const x = this.compactBits(morton);
    const y = this.compactBits(morton >> 1n);
    const z = this.compactBits(morton >> 2n);
    return { x, y, z };
  }
}
