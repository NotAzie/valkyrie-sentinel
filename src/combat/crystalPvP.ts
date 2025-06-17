import { Vector3D } from '../types';

export class CrystalPvPEngine {
  constructor(private readonly bot: any) {}

  public evaluateObsidianPlacement(targetPos: Vector3D): Vector3D | null {
    // Search for valid obsidian placement adjacent to target with air above
    const offsets = [
      { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
      { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 }
    ];

    for (const off of offsets) {
      const candidate = {
        x: Math.floor(targetPos.x + off.x),
        y: Math.floor(targetPos.y + off.y),
        z: Math.floor(targetPos.z + off.z)
      };

      const block = this.bot.blockAt(candidate);
      const above = this.bot.blockAt({ ...candidate, y: candidate.y + 1 });
      const above2 = this.bot.blockAt({ ...candidate, y: candidate.y + 2 });

      if (block && (block.name === 'obsidian' || block.name === 'bedrock')) {
        if (above && above.name === 'air' && (!above2 || above2.name === 'air')) {
          return candidate;
        }
      }
    }

    return null;
  }

  public computeBlastExposure(explosionPos: Vector3D, entityPos: Vector3D): number {
    const dist = Math.hypot(
      entityPos.x - explosionPos.x,
      entityPos.y - explosionPos.y,
      entityPos.z - explosionPos.z
    );
    const maxRadius = 12.0;
    if (dist >= maxRadius) return 0;
    return (1.0 - dist / maxRadius);
  }
}
