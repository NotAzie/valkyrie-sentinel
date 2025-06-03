import { describe, it, expect } from 'vitest';
import { Octree } from '../src/spatial/octree';
import { VoxelAStar } from '../src/pathfinding/astar';

describe('Spatial Octree Partitioning', () => {
  it('correctly inserts points and queries radius', () => {
    const octree = new Octree({
      min: { x: -50, y: -50, z: -50 },
      max: { x: 50, y: 50, z: 50 }
    });

    octree.insert({ id: 1, position: { x: 0, y: 0, z: 0 }, data: 'center' });
    octree.insert({ id: 2, position: { x: 2, y: 0, z: 0 }, data: 'near' });
    octree.insert({ id: 3, position: { x: 30, y: 30, z: 30 }, data: 'far' });

    const results = octree.queryRadius({ x: 0, y: 0, z: 0 }, 5);
    expect(results.length).toBe(2);
    expect(results.map(r => r.id)).toContain(1);
    expect(results.map(r => r.id)).toContain(2);
  });
});

describe('Voxel A* Pathfinding', () => {
  it('computes euclidean heuristics accurately', () => {
    const h = VoxelAStar.heuristic({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
    expect(h).toBe(5);
  });
});
