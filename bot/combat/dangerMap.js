'use strict';

/**
 * Artificial Potential Danger Map.
 * Computes gradient descent escape vectors away from hostile clusters and terrain hazards.
 */
class DangerMap {
  constructor(bot) {
    this.bot = bot;
  }

  computeRepulsionVector(scanRadius = 16.0) {
    const botPos = this.bot.entity.position;
    let netRepulsionX = 0;
    let netRepulsionZ = 0;

    const entities = Object.values(this.bot.entities);
    for (const ent of entities) {
      if (!ent || ent === this.bot.entity || !ent.position) continue;
      if (ent.type !== 'mob' && ent.type !== 'player') continue;

      const dist = botPos.distanceTo(ent.position);
      if (dist > scanRadius || dist < 0.01) continue;

      // Inverse-square repulsion
      const weight = 1.0 / (dist * dist);
      const dx = botPos.x - ent.position.x;
      const dz = botPos.z - ent.position.z;

      netRepulsionX += (dx / dist) * weight;
      netRepulsionZ += (dz / dist) * weight;
    }

    const mag = Math.hypot(netRepulsionX, netRepulsionZ);
    if (mag > 0) {
      return {
        x: netRepulsionX / mag,
        z: netRepulsionZ / mag,
        magnitude: mag
      };
    }

    return { x: 0, z: 0, magnitude: 0 };
  }
}

module.exports = DangerMap;
