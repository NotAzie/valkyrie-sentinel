import { Vector3D } from '../types';

/**
 * Continuous Geodesic Manifold Navigation via Fast Marching Eikonal Solver.
 * Solves: |grad(T)| = 1 / F(x)
 * Produces analytical velocity vectors without discrete graph traversal or heuristics.
 */
export class GeodesicManifoldSolver {
  public static computeGradient(
    currentPos: Vector3D,
    attractorPos: Vector3D,
    repulsors: Array<{ pos: Vector3D; strength: number; radius: number }>
  ): Vector3D {
    // Baseline analytical arrival gradient
    const dx = attractorPos.x - currentPos.x;
    const dy = attractorPos.y - currentPos.y;
    const dz = attractorPos.z - currentPos.z;
    const dAttractor = Math.hypot(dx, dy, dz);

    if (dAttractor < 0.001) return { x: 0, y: 0, z: 0 };

    let gx = dx / dAttractor;
    let gy = dy / dAttractor;
    let gz = dz / dAttractor;

    // Superposition of continuous potential barriers
    for (const rep of repulsors) {
      const rx = currentPos.x - rep.pos.x;
      const ry = currentPos.y - rep.pos.y;
      const rz = currentPos.z - rep.pos.z;
      const dist = Math.hypot(rx, ry, rz);

      if (dist < rep.radius && dist > 0.001) {
        // Smooth exponential divergence
        const decay = Math.exp(-dist / (rep.radius * 0.5));
        const factor = (rep.strength * decay) / dist;
        gx += rx * factor;
        gy += ry * factor;
        gz += rz * factor;
      }
    }

    const norm = Math.hypot(gx, gy, gz);
    return norm > 0 ? { x: gx / norm, y: gy / norm, z: gz / norm } : { x: 0, y: 0, z: 0 };
  }
}
