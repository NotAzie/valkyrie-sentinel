import { Vector3D } from '../types';
import { RK4BallisticsSolver, TrajectoryState } from './rk4Solver';

export class KinematicBallisticsPredictor {
  public static solveIntercept(
    origin: Vector3D,
    projectileSpeed: number,
    targetPos: Vector3D,
    targetVel: Vector3D,
    maxTicks = 60
  ): { pitch: number; yaw: number; flightTicks: number } | null {
    const dx = targetPos.x - origin.x;
    const dz = targetPos.z - origin.z;
    const baseDist = Math.hypot(dx, dz);
    const yaw = Math.atan2(-dx, -dz);

    for (let pitchDeg = -20; pitchDeg <= 60; pitchDeg += 0.5) {
      const pitchRad = (pitchDeg * Math.PI) / 180;
      const vHorizontal = projectileSpeed * Math.cos(pitchRad);
      const vVertical = projectileSpeed * Math.sin(pitchRad);

      let simState: TrajectoryState = {
        x: 0,
        y: origin.y,
        z: 0,
        vx: vHorizontal,
        vy: vVertical,
        vz: 0
      };

      for (let t = 1; t <= maxTicks; t++) {
        simState = RK4BallisticsSolver.step(simState, 1.0);
        const currentTargetPos = {
          x: targetPos.x + targetVel.x * t,
          y: targetPos.y + targetVel.y * t,
          z: targetPos.z + targetVel.z * t
        };

        const targetDist = Math.hypot(currentTargetPos.x - origin.x, currentTargetPos.z - origin.z);
        if (Math.abs(simState.x - targetDist) < 1.2 && Math.abs(simState.y - currentTargetPos.y) < 1.5) {
          return { pitch: pitchRad, yaw, flightTicks: t };
        }
      }
    }

    return null;
  }
}
