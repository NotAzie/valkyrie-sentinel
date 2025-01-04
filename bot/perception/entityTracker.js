'use strict';

/**
 * EntityTracker — maintains an efficient live map of nearby entities.
 *
 * Uses Mineflayer's entity events (spawn/move/gone) rather than brute-force
 * radius scans every tick. Full re-sync happens infrequently.
 */

const HOSTILE_MOBS = new Set([
  'zombie', 'skeleton', 'creeper', 'spider', 'cave_spider',
  'witch', 'blaze', 'enderman', 'phantom', 'drowned',
  'husk', 'stray', 'pillager', 'vindicator', 'baby_zombie',
  'zombie_villager', 'slime', 'magma_cube', 'guardian',
  'elder_guardian', 'wither_skeleton', 'bogged',
]);

const PASSIVE_MOBS = new Set([
  'cow', 'pig', 'sheep', 'chicken', 'rabbit', 'cod', 'salmon',
  'tropical_fish', 'squid', 'mooshroom', 'horse', 'donkey', 'mule',
]);

const THREAT_SCORES = {
  creeper:      90,
  skeleton:     80,
  stray:        80,
  bogged:       75,
  cave_spider:  70,
  baby_zombie:  70,
  witch:        65,
  phantom:      65,
  spider:       55,
  zombie:       50,
  husk:         50,
  drowned:      50,
  pillager:     85,
  vindicator:   85,
  enderman:     40,
  slime:        30,
  magma_cube:   30,
};

const PASSIVE_SCORES = {
  cow:     60,
  pig:     50,
  sheep:   55,
  chicken: 40,
  rabbit:  35,
};

// How far we care about entities (blocks)
const TRACK_RADIUS     = 32;
const LOOT_RADIUS      = 16;
const LOOT_EXPIRE_MS   = 30_000;
const ENTITY_EXPIRE_MS = 10_000;

class EntityTracker {
  constructor(bot) {
    this.bot      = bot;
    this.entities = new Map(); // entityId → TrackedEntity
    this.loot     = new Map(); // entityId → { entity, seenAt }

    // Initial population from already-loaded entities
    setImmediate(() => this._initialSync());
  }

  // ── Public API ────────────────────────────────────────────────────────────

  getHighestPriorityTarget() {
    let best = null, bestScore = -1;
    const botPos = this.bot.entity?.position;
    if (!botPos) return null;

    for (const [, tracked] of this.entities) {
      if (!tracked.isHostile) continue;
      if (!tracked.entity?.isValid) continue;
      if (this.bot.memory?.isBlacklisted(tracked.entity.id)) continue;

      const score = this._calcPriority(tracked, botPos);
      if (score > bestScore) {
        bestScore = score;
        best = tracked.entity;
      }
    }
    return best;
  }

  getBestHuntTarget() {
    let best = null, bestScore = -1;
    const botPos = this.bot.entity?.position;
    if (!botPos) return null;

    for (const [, tracked] of this.entities) {
      if (!tracked.isValid()) continue;
      if (this.bot.memory?.isBlacklisted(tracked.entity.id)) continue;

      let score = 0;
      if (tracked.isHostile) {
        // In hunt mode hostile mobs also count — they drop XP / loot
        score = (THREAT_SCORES[tracked.name] ?? 30);
      } else if (tracked.isPassive) {
        score = (PASSIVE_SCORES[tracked.name] ?? 20);
      } else {
        continue;
      }

      const dist = tracked.entity.position.distanceTo(botPos);
      if (dist > TRACK_RADIUS) continue;
      score -= dist * 0.5; // closer = better

      if (score > bestScore) {
        bestScore = score;
        best = tracked.entity;
      }
    }
    return best;
  }

  getHostileCount() {
    let count = 0;
    const botPos = this.bot.entity?.position;
    if (!botPos) return 0;

    for (const [, t] of this.entities) {
      if (!t.isHostile || !t.isValid()) continue;
      if (t.entity.position.distanceTo(botPos) < 12) count++;
    }
    return count;
  }

  hasNearbyLoot() {
    const botPos = this.bot.entity?.position;
    if (!botPos) return false;
    for (const [, l] of this.loot) {
      if (!l.entity?.isValid) continue;
      if (l.entity.position.distanceTo(botPos) < LOOT_RADIUS) return true;
    }
    return false;
  }

  getNearbyLoot() {
    const botPos = this.bot.entity?.position;
    if (!botPos) return [];
    return [...this.loot.values()]
      .filter(l => l.entity?.isValid && l.entity.position.distanceTo(botPos) < LOOT_RADIUS)
      .map(l => l.entity);
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  onSpawn(entity) {
    if (!entity) return;
    this._track(entity);
  }

  onMove(entity) {
    if (!entity) return;
    const t = this.entities.get(entity.id);
    if (t) t.lastSeen = Date.now();
  }

  onGone(entity) {
    if (!entity) return;
    this.entities.delete(entity.id);
    this.loot.delete(entity.id);
  }

  onHurt(entity) {
    // Refresh tracking on damage
    const t = this.entities.get(entity?.id);
    if (t) t.lastSeen = Date.now();
  }

  onLootSpawn(entity) {
    if (!entity) return;
    this.loot.set(entity.id, { entity, seenAt: Date.now() });
  }

  // ── Cleanup (called every 5s by stateManager) ─────────────────────────────

  cleanup() {
    const now = Date.now();

    for (const [id, t] of this.entities) {
      if (!t.entity?.isValid || now - t.lastSeen > ENTITY_EXPIRE_MS) {
        this.entities.delete(id);
      }
    }

    for (const [id, l] of this.loot) {
      if (!l.entity?.isValid || now - l.seenAt > LOOT_EXPIRE_MS) {
        this.loot.delete(id);
      }
    }

    this.bot.memory?.cleanup();
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _track(entity) {
    if (!entity || !entity.name) return;

    const name      = entity.name.toLowerCase().replace('minecraft:', '');
    const isHostile = HOSTILE_MOBS.has(name);
    const isPassive = PASSIVE_MOBS.has(name);
    const isPlayer  = entity.type === 'player';

    if (!isHostile && !isPassive && !isPlayer) return;

    this.entities.set(entity.id, {
      entity,
      name,
      isHostile,
      isPassive,
      isPlayer,
      lastSeen: Date.now(),
      isValid() { return !!entity?.isValid; },
    });
  }

  _calcPriority(tracked, botPos) {
    const dist       = tracked.entity.position.distanceTo(botPos);
    if (dist > TRACK_RADIUS) return -1;

    const threatBase = THREAT_SCORES[tracked.name] ?? 30;
    const distWeight = Math.max(0, (TRACK_RADIUS - dist) / TRACK_RADIUS) * 40;

    // Creeper: massive bonus because of explosion danger
    const specialBonus = tracked.name === 'creeper' ? 20 : 0;

    return threatBase + distWeight + specialBonus;
  }

  _initialSync() {
    for (const entity of Object.values(this.bot.entities)) {
      this._track(entity);
      if (entity.name === 'item') {
        this.loot.set(entity.id, { entity, seenAt: Date.now() });
      }
    }
  }
}

module.exports = EntityTracker;
