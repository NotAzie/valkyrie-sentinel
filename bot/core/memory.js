'use strict';

/**
 * Persistent Spatial Memory Ledger.
 * Employs volatile LRU eviction and decaying threat heatmaps.
 */
class Memory {
  constructor(capacity = 500, decayHalfLifeMs = 30000) {
    this.capacity = capacity;
    this.decayHalfLifeMs = decayHalfLifeMs;
    this.spatialPoints = new Map();
    this.entityHistories = new Map();
    this.homePosition = null;
  }

  setHome(vec3Pos) {
    this.homePosition = vec3Pos.clone();
  }

  getHome() {
    return this.homePosition;
  }

  recordEntityObservation(id, type, position, threatScore = 1.0) {
    this.entityHistories.set(id, {
      type,
      position: position.clone(),
      threatScore,
      timestamp: Date.now()
    });

    if (this.entityHistories.size > this.capacity) {
      const oldestKey = this.entityHistories.keys().next().value;
      this.entityHistories.delete(oldestKey);
    }
  }

  getDecayedThreat(id) {
    const entry = this.entityHistories.get(id);
    if (!entry) return 0;
    const age = Date.now() - entry.timestamp;
    const factor = Math.pow(0.5, age / this.decayHalfLifeMs);
    return entry.threatScore * factor;
  }

  purgeStale(maxAgeMs = 60000) {
    const now = Date.now();
    for (const [id, entry] of this.entityHistories.entries()) {
      if (now - entry.timestamp > maxAgeMs) {
        this.entityHistories.delete(id);
      }
    }
  }
}

module.exports = Memory;
