/**
 * Theoretical Maximum Efficiency 3D Morton (Z-Order) Lattice.
 * Utilizes branchless bit interleaving for coordinate encoding and decoding.
 */
export class MortonLattice {
  public static encode(x: number, y: number, z: number): bigint {
    let bx = BigInt(x & 0x3ff);
    let by = BigInt(y & 0x3ff);
    let bz = BigInt(z & 0x3ff);

    bx = (bx | (bx << 16n)) & 0x030000FFn;
    bx = (bx | (bx << 8n))  & 0x0300F00Fn;
    bx = (bx | (bx << 4n))  & 0x030C30C3n;
    bx = (bx | (bx << 2n))  & 0x09249249n;

    by = (by | (by << 16n)) & 0x030000FFn;
    by = (by | (by << 8n))  & 0x0300F00Fn;
    by = (by | (by << 4n))  & 0x030C30C3n;
    by = (by | (by << 2n))  & 0x09249249n;

    bz = (bz | (bz << 16n)) & 0x030000FFn;
    bz = (bz | (bz << 8n))  & 0x0300F00Fn;
    bz = (bz | (bz << 4n))  & 0x030C30C3n;
    bz = (bz | (bz << 2n))  & 0x09249249n;

    return bx | (by << 1n) | (bz << 2n);
  }

  public static decode(code: bigint): { x: number; y: number; z: number } {
    let x = code & 0x09249249n;
    let y = (code >> 1n) & 0x09249249n;
    let z = (code >> 2n) & 0x09249249n;

    x = (x | (x >> 2n))  & 0x030C30C3n;
    x = (x | (x >> 4n))  & 0x0300F00Fn;
    x = (x | (x >> 8n))  & 0x030000FFn;
    x = (x | (x >> 16n)) & 0x3ffn;

    y = (y | (y >> 2n))  & 0x030C30C3n;
    y = (y | (y >> 4n))  & 0x0300F00Fn;
    y = (y | (y >> 8n))  & 0x030000FFn;
    y = (y | (y >> 16n)) & 0x3ffn;

    z = (z | (z >> 2n))  & 0x030C30C3n;
    z = (z | (z >> 4n))  & 0x0300F00Fn;
    z = (z | (z >> 8n))  & 0x030000FFn;
    z = (z | (z >> 16n)) & 0x3ffn;

    return { x: Number(x), y: Number(y), z: Number(z) };
  }
}
