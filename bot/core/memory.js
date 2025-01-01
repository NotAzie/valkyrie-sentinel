'use strict';

/**
 * Memory — session-only storage for locations, danger zones, etc.
 * Clears on restart. No persistence.
 */
class Memory {
  constructor() {
    this.home          = null;   // Vec3
    this.chest         = null;   // Vec3
    this.dangerZones   = [];     // [{ pos: Vec3, expiresAt: timestamp }]
    this.safeZones     = [];     // [Vec3]
    this.blacklistTargets = new Map(); // entityId → unblacklist timestamp
  }

  // ── Home / Chest ──────────────────────────────────────────────────────────

  setHome(pos) {
    this.home = pos.clone ? pos.clone() : { ...pos };
    console.log('[Memory] Home set:', this.home);
  }

  setChest(pos) {
    this.chest = pos.clone ? pos.clone() : { ...pos };
    console.log('[Memory] Chest set:', this.chest);
  }

  hasHome()  { return this.home  !== null; }
  hasChest() { return this.chest !== null; }

  // ── Danger Zones ──────────────────────────────────────────────────────────

  addDangerZone(pos, durationMs = 15000) {
    this.dangerZones.push({
      pos: pos.clone ? pos.clone() : { ...pos },
      expiresAt: Date.now() + durationMs,
    });
  }

  isDangerZone(pos, radius = 5) {
    const now = Date.now();
    return this.dangerZones.some(z => {
      if (z.expiresAt < now) return false;
      const dx = z.pos.x - pos.x;
      const dz = z.pos.z - pos.z;
      return Math.sqrt(dx * dx + dz * dz) < radius;
    });
  }

  cleanupDangerZones() {
    const now = Date.now();
    this.dangerZones = this.dangerZones.filter(z => z.expiresAt > now);
  }

  // ── Target Blacklist ──────────────────────────────────────────────────────

  blacklistTarget(entityId, durationMs = 10000) {
    this.blacklistTargets.set(entityId, Date.now() + durationMs);
  }

  isBlacklisted(entityId) {
    const exp = this.blacklistTargets.get(entityId);
    if (!exp) return false;
    if (Date.now() > exp) {
      this.blacklistTargets.delete(entityId);
      return false;
    }
    return true;
  }

  cleanupBlacklist() {
    const now = Date.now();
    for (const [id, exp] of this.blacklistTargets) {
      if (now > exp) this.blacklistTargets.delete(id);
    }
  }

  // ── Periodic cleanup ──────────────────────────────────────────────────────

  cleanup() {
    this.cleanupDangerZones();
    this.cleanupBlacklist();
  }
}

module.exports = Memory;
