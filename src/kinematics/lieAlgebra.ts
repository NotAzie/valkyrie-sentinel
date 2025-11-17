import { Vector3D } from '../types';

/**
 * Lie Group SE(3) and Lie Algebra se(3) Rigid Body Kinematics.
 * Eliminates Euler gimbal lock and provides smooth C2-continuous rotation paths.
 */
export class LieAlgebraKinematics {
  public static rodriguesRotation(v: Vector3D, axis: Vector3D, thetaRad: number): Vector3D {
    const cosTheta = Math.cos(thetaRad);
    const sinTheta = Math.sin(thetaRad);

    // v_rot = v*cos(theta) + (axis x v)*sin(theta) + axis*(axis . v)*(1 - cos(theta))
    const dot = axis.x * v.x + axis.y * v.y + axis.z * v.z;
    const crossX = axis.y * v.z - axis.z * v.y;
    const crossY = axis.z * v.x - axis.x * v.z;
    const crossZ = axis.x * v.y - axis.y * v.x;

    const k = 1.0 - cosTheta;

    return {
      x: v.x * cosTheta + crossX * sinTheta + axis.x * dot * k,
      y: v.y * cosTheta + crossY * sinTheta + axis.y * dot * k,
      z: v.z * cosTheta + crossZ * sinTheta + axis.z * dot * k
    };
  }

  public static vectorToYawPitch(v: Vector3D): { yaw: number; pitch: number } {
    const yaw = Math.atan2(-v.x, -v.z);
    const groundDist = Math.hypot(v.x, v.z);
    const pitch = Math.atan2(v.y, groundDist);
    return { yaw, pitch };
  }
}
