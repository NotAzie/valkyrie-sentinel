import { MortonLattice } from './mortonLattice';

/**
 * High-Throughput Flat Bitboard Table.
 * Uses a single contiguous BigUint64Array to store solid voxel states.
 * Replaces recursive Octree traversal with single O(1) bitwise operations.
 */
export class BitboardMaskTable {
  private words: BigUint64Array;

  constructor(wordCount = 65536) {
    this.words = new BigUint64Array(wordCount);
  }

  public setVoxel(x: number, y: number, z: number, solid: boolean): void {
    const code = MortonLattice.encode(x & 0x3ff, y & 0x3ff, z & 0x3ff);
    const wordIndex = Number(code >> 6n) % this.words.length;
    const bitOffset = Number(code & 63n);

    if (solid) {
      this.words[wordIndex] |= (1n << BigInt(bitOffset));
    } else {
      this.words[wordIndex] &= ~(1n << BigInt(bitOffset));
    }
  }

  public isSolid(x: number, y: number, z: number): boolean {
    const code = MortonLattice.encode(x & 0x3ff, y & 0x3ff, z & 0x3ff);
    const wordIndex = Number(code >> 6n) % this.words.length;
    const bitOffset = Number(code & 63n);
    return (this.words[wordIndex] & (1n << BigInt(bitOffset))) !== 0n;
  }

  public checkNeighborhoodMask(x: number, y: number, z: number): boolean {
    // Check 3x3 horizontal neighborhood in O(1)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (this.isSolid(x + dx, y, z + dz)) return true;
      }
    }
    return false;
  }
}
