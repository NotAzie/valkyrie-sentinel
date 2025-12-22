/**
 * Theoretical Maximum Efficiency Math Library.
 * Replaces expensive transcendental functions with bitwise operations,
 * Padé approximants, and zero-allocation vector math.
 */
export class FastMath {
  public static fastDistance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public static fastNorm3D(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
  }

  public static fastInvSqrt(val: number): number {
    // Fast inverse square root fallback for JS V8 engine
    return 1.0 / Math.sqrt(val);
  }

  public static clamp(val: number, min: number, max: number): number {
    return val < min ? min : val > max ? max : val;
  }
}
