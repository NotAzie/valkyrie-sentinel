import { Vector3D } from '../types';

export interface ReachableCone {
  centroid: Vector3D;
  semiMajorAxis: number;
  semiMinorAxis: number;
  deterministicConfidence: number; // [0.0 = random walk, 1.0 = fully ballistic locked]
}

/**
 * Causal Horizon Inversion (CHI).
 * The Unfair Advantage Feature:
 * Exploits Minecraft deterministic kinematic integration to predict target phase-space
 * coordinates 1-4 ticks into the future. Eliminates network latency by pre-aligning
 * weapon strike packets to the exact tick the target enters the reach boundary.
 */
export class CausalHorizonInverter {
  // Minecraft player kinematic constants
  private static readonly AIR_DRAG = 0.91;
  private static readonly GROUND_DRAG = 0.546;
  private static readonly GRAVITY_ACCEL = 0.08;

  public static predictReachableCone(
    pos: Vector3D,
    vel: Vector3D,
    isOnGround: boolean,
    lookaheadTicks: number
  ): ReachableCone {
    let px = pos.x;
    let py = pos.y;
    let pz = pos.z;
    let vx = vel.x;
    let vy = vel.y;
    let vz = vel.z;

    const drag = isOnGround ? this.GROUND_DRAG : this.AIR_DRAG;
    const isBallistic = !isOnGround || Math.abs(vy) > 0.05;

    for (let t = 0; t < lookaheadTicks; t++) {
      px += vx;
      py += vy;
      pz += vz;

      vx *= drag;
      vz *= drag;
      vy = (vy - this.GRAVITY_ACCEL) * 0.98;
    }

    // When airborne or sprinting, degrees of freedom collapse to near-deterministic trajectory
    const confidence = isBallistic ? 0.98 : 0.82;
    const dispersion = (1.0 - confidence) * lookaheadTicks * 0.4;

    return {
      centroid: { x: px, y: py, z: pz },
      semiMajorAxis: Math.hypot(vx, vz) * lookaheadTicks + dispersion,
      semiMinorAxis: dispersion,
      deterministicConfidence: confidence
    };
  }

  public static calculateInterceptionWindow(
    botEyePos: Vector3D,
    targetCone: ReachableCone,
    maxReach = 3.0000
  ): { willIntercept: boolean; distanceAtPeak: number; preAimVector: Vector3D } {
    const dx = targetCone.centroid.x - botEyePos.x;
    const dy = targetCone.centroid.y - botEyePos.y;
    const dz = targetCone.centroid.z - botEyePos.z;
    const dist = Math.hypot(dx, dy, dz);

    return {
      willIntercept: dist <= maxReach,
      distanceAtPeak: dist,
      preAimVector: { x: dx / dist, y: dy / dist, z: dz / dist }
    };
  }
}
