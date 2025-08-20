import { Vector3D } from '../types';

export class PotentialFieldNavigator {
  public static computeVector(
    botPos: Vector3D,
    targetPos: Vector3D,
    repulsors: Array<{ pos: Vector3D; weight: number; radius: number }>
  ): Vector3D {
    // Attractive force toward target
    const dx = targetPos.x - botPos.x;
    const dz = targetPos.z - botPos.z;
    const targetDist = Math.hypot(dx, dz);

    let fx = targetDist > 0 ? (dx / targetDist) * 1.0 : 0;
    let fz = targetDist > 0 ? (dz / targetDist) * 1.0 : 0;

    // Repulsive forces
    for (const rep of repulsors) {
      const rx = botPos.x - rep.pos.x;
      const rz = botPos.z - rep.pos.z;
      const d = Math.hypot(rx, rz);

      if (d < rep.radius && d > 0.001) {
        const factor = rep.weight * (1.0 / d - 1.0 / rep.radius) * (1.0 / (d * d));
        fx += (rx / d) * factor;
        fz += (rz / d) * factor;
      }
    }

    const totalMag = Math.hypot(fx, fz);
    return totalMag > 0 ? { x: fx / totalMag, y: 0, z: fz / totalMag } : { x: 0, y: 0, z: 0 };
  }
}
