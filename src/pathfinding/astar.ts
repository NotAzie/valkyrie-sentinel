import { Vector3D } from '../types';

interface PathNode {
  pos: Vector3D;
  gCost: number;
  hCost: number;
  fCost: number;
  parent: PathNode | null;
}

export class VoxelAStar {
  public static heuristic(a: Vector3D, b: Vector3D): number {
    return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  }

  public static findPath(
    start: Vector3D,
    goal: Vector3D,
    isWalkable: (p: Vector3D) => boolean,
    maxIterations = 1000
  ): Vector3D[] {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
      pos: start,
      gCost: 0,
      hCost: this.heuristic(start, goal),
      fCost: this.heuristic(start, goal),
      parent: null
    };

    openSet.push(startNode);

    let iterations = 0;
    while (openSet.length > 0 && iterations++ < maxIterations) {
      openSet.sort((a, b) => a.fCost - b.fCost);
      const current = openSet.shift()!;

      if (this.heuristic(current.pos, goal) <= 1.5) {
        return this.reconstructPath(current);
      }

      const key = `${Math.floor(current.pos.x)},${Math.floor(current.pos.y)},${Math.floor(current.pos.z)}`;
      closedSet.add(key);

      const neighbors = this.getNeighbors(current.pos);
      for (const nPos of neighbors) {
        const nKey = `${Math.floor(nPos.x)},${Math.floor(nPos.y)},${Math.floor(nPos.z)}`;
        if (closedSet.has(nKey) || !isWalkable(nPos)) continue;

        const g = current.gCost + this.heuristic(current.pos, nPos);
        const h = this.heuristic(nPos, goal);
        const existing = openSet.find(n => n.pos.x === nPos.x && n.pos.y === nPos.y && n.pos.z === nPos.z);

        if (!existing || g < existing.gCost) {
          if (!existing) {
            openSet.push({ pos: nPos, gCost: g, hCost: h, fCost: g + h, parent: current });
          } else {
            existing.gCost = g;
            existing.fCost = g + h;
            existing.parent = current;
          }
        }
      }
    }

    return [];
  }

  private static getNeighbors(p: Vector3D): Vector3D[] {
    const offsets = [
      { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
      { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 },
      { x: 0, y: -1, z: 1 }, { x: 0, y: -1, z: -1 }
    ];
    return offsets.map(o => ({ x: p.x + o.x, y: p.y + o.y, z: p.z + o.z }));
  }

  private static reconstructPath(node: PathNode): Vector3D[] {
    const path: Vector3D[] = [];
    let curr: PathNode | null = node;
    while (curr) {
      path.unshift(curr.pos);
      curr = curr.parent;
    }
    return path;
  }
}
