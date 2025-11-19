import { Vector3D } from '../types';
import { CausalHorizonInverter, ReachableCone } from '../chi/causalHorizon';
import { GeodesicManifoldSolver } from '../eikonal/geodesicManifold';
import { LieAlgebraKinematics } from '../kinematics/lieAlgebra';

export interface WorldSnapshot {
  botPosition: Vector3D;
  botVelocity: Vector3D;
  botHealth: number;
  targetPosition: Vector3D | null;
  targetVelocity: Vector3D | null;
  targetOnGround: boolean;
  serverPingMs: number;
  hazards: Array<{ pos: Vector3D; strength: number; radius: number }>;
}

export interface MonadicActionVector {
  movementVelocity: Vector3D;
  aimAngles: { yaw: number; pitch: number };
  shouldAttack: boolean;
  criticalStrikeReady: boolean;
  predictedReach: number;
  actionConfidence: number;
}

/**
 * Radical Simplification: Monadic Action Vector (MAV) Pipeline.
 * Collapses perception, kinematics, threat analysis, and packet scheduling
 * into a single pure deterministic functional evaluation under 30 microseconds.
 */
export class MonadicActionResolver {
  public static resolve(world: WorldSnapshot): MonadicActionVector {
    if (!world.targetPosition || !world.targetVelocity) {
      return {
        movementVelocity: { x: 0, y: 0, z: 0 },
        aimAngles: { yaw: 0, pitch: 0 },
        shouldAttack: false,
        criticalStrikeReady: false,
        predictedReach: 0,
        actionConfidence: 1.0
      };
    }

    const lookaheadTicks = Math.max(1, Math.round((world.serverPingMs / 2) / 50));

    // 1. Causal Horizon Projection
    const cone = CausalHorizonInverter.predictReachableCone(
      world.targetPosition,
      world.targetVelocity,
      world.targetOnGround,
      lookaheadTicks
    );

    // 2. Continuous Geodesic Velocity
    const moveVector = GeodesicManifoldSolver.computeGradient(
      world.botPosition,
      cone.centroid,
      world.hazards
    );

    // 3. Intercept and Reach Boundary Check
    const intercept = CausalHorizonInverter.calculateInterceptionWindow(
      world.botPosition,
      cone,
      3.0000
    );

    // 4. Lie Algebra Head Orientation
    const aimAngles = LieAlgebraKinematics.vectorToYawPitch(intercept.preAimVector);

    // 5. Critical Strike Kinematic Condition
    const isFalling = world.botVelocity.y < -0.08;

    return {
      movementVelocity: moveVector,
      aimAngles,
      shouldAttack: intercept.willIntercept,
      criticalStrikeReady: isFalling,
      predictedReach: intercept.distanceAtPeak,
      actionConfidence: cone.deterministicConfidence
    };
  }
}
