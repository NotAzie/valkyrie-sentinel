import { Vector3D } from '../types';

export class BoxIntersection {
  public static intersectRayAABB(
    origin: Vector3D,
    dir: Vector3D,
    boxMin: Vector3D,
    boxMax: Vector3D
  ): boolean {
    const invDirX = 1.0 / dir.x;
    const invDirY = 1.0 / dir.y;
    const invDirZ = 1.0 / dir.z;

    const t1 = (boxMin.x - origin.x) * invDirX;
    const t2 = (boxMax.x - origin.x) * invDirX;
    const t3 = (boxMin.y - origin.y) * invDirY;
    const t4 = (boxMax.y - origin.y) * invDirY;
    const t5 = (boxMin.z - origin.z) * invDirZ;
    const t6 = (boxMax.z - origin.z) * invDirZ;

    const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    if (tmax < 0 || tmin > tmax) return false;
    return true;
  }
}
