import { Vector3D } from '../types';

export interface SpatialPoint {
  id: number;
  position: Vector3D;
  data: any;
}

export interface BoundingBox {
  min: Vector3D;
  max: Vector3D;
}

export class Octree {
  private points: SpatialPoint[] = [];
  private children: Octree[] | null = null;

  constructor(
    public readonly bounds: BoundingBox,
    public readonly capacity = 8,
    public readonly maxDepth = 6,
    public readonly currentDepth = 0
  ) {}

  public insert(point: SpatialPoint): boolean {
    if (!this.contains(this.bounds, point.position)) {
      return false;
    }

    if (this.points.length < this.capacity || this.currentDepth >= this.maxDepth) {
      this.points.push(point);
      return true;
    }

    if (!this.children) {
      this.subdivide();
    }

    for (const child of this.children!) {
      if (child.insert(point)) return true;
    }

    return false;
  }

  public queryRadius(center: Vector3D, radius: number): SpatialPoint[] {
    const results: SpatialPoint[] = [];
    const r2 = radius * radius;

    if (!this.intersectsSphere(this.bounds, center, radius)) {
      return results;
    }

    for (const p of this.points) {
      const dx = p.position.x - center.x;
      const dy = p.position.y - center.y;
      const dz = p.position.z - center.z;
      if (dx * dx + dy * dy + dz * dz <= r2) {
        results.push(p);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        results.push(...child.queryRadius(center, radius));
      }
    }

    return results;
  }

  private subdivide(): void {
    const { min, max } = this.bounds;
    const midX = (min.x + max.x) / 2;
    const midY = (min.y + max.y) / 2;
    const midZ = (min.z + max.z) / 2;
    const nextDepth = this.currentDepth + 1;

    this.children = [
      new Octree({ min, max: { x: midX, y: midY, z: midZ } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: midX, y: min.y, z: min.z }, max: { x: max.x, y: midY, z: midZ } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: min.x, y: midY, z: min.z }, max: { x: midX, y: max.y, z: midZ } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: midX, y: midY, z: min.z }, max: { x: max.x, y: max.y, z: midZ } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: min.x, y: min.y, z: midZ }, max: { x: midX, y: midY, z: max.z } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: midX, y: min.y, z: midZ }, max: { x: max.x, y: midY, z: max.z } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: min.x, y: midY, z: midZ }, max: { x: midX, y: max.y, z: max.z } }, this.capacity, this.maxDepth, nextDepth),
      new Octree({ min: { x: midX, y: midY, z: midZ }, max }, this.capacity, this.maxDepth, nextDepth)
    ];
  }

  private contains(b: BoundingBox, p: Vector3D): boolean {
    return (
      p.x >= b.min.x && p.x <= b.max.x &&
      p.y >= b.min.y && p.y <= b.max.y &&
      p.z >= b.min.z && p.z <= b.max.z
    );
  }

  private intersectsSphere(b: BoundingBox, c: Vector3D, r: number): boolean {
    let d = 0;
    if (c.x < b.min.x) d += (c.x - b.min.x) ** 2;
    else if (c.x > b.max.x) d += (c.x - b.max.x) ** 2;
    if (c.y < b.min.y) d += (c.y - b.min.y) ** 2;
    else if (c.y > b.max.y) d += (c.y - b.max.y) ** 2;
    if (c.z < b.min.z) d += (c.z - b.min.z) ** 2;
    else if (c.z > b.max.z) d += (c.z - b.max.z) ** 2;
    return d <= r * r;
  }
}
