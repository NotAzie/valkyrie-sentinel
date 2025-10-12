import { Vector3D } from '../types';

export class ProjectileInterceptor {
  public static willHitHitbox(
    projPos: Vector3D,
    projVel: Vector3D,
    targetBoxMin: Vector3D,
    targetBoxMax: Vector3D,
    lookaheadTicks = 10
  ): boolean {
    let curr = { ...projPos };
    for (let t = 0; t < lookaheadTicks; t++) {
      curr.x += projVel.x;
      curr.y += projVel.y;
      curr.z += projVel.z;
      // Gravity decay
      projVel.y -= 0.05;

      if (
        curr.x >= targetBoxMin.x && curr.x <= targetBoxMax.x &&
        curr.y >= targetBoxMin.y && curr.y <= targetBoxMax.y &&
        curr.z >= targetBoxMin.z && curr.z <= targetBoxMax.z
      ) {
        return true;
      }
    }
    return false;
  }
}
