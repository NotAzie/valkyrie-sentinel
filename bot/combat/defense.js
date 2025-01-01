'use strict';

/**
 * Defense — handles ESCAPE state.
 *
 * Triggered when:
 *  - health ≤ 3
 *  - surrounded by 4+ hostiles while below 8 HP
 *
 * Strategy:
 *  - Sprint away from nearest threat cluster
 *  - Shield while escaping
 *  - Find safe location and stop
 */

const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const Vec3 = require('vec3');

const ESCAPE_DIST    = 24;  // blocks to run
const ESCAPE_TIMEOUT = 8000; // ms before giving up escape

class Defense {
  constructor(bot, stateManager) {
    this.bot         = bot;
    this.sm          = stateManager;
    this._escapeStart = 0;
    this._escapeGoal  = null;
  }

  enter() {
    console.log('[Defense] ESCAPE triggered!');
    this.bot.chat('Escaping! Health critical!');
    this._escapeStart = Date.now();
    this._escapeGoal  = this._computeEscapeGoal();
    this.bot.setControlState('sprint', true);
    this._raiseShield();
  }

  tick() {
    const now    = Date.now();
    const health = this.bot.health ?? 20;

    // Recovered enough?
    if (health > 8 && this.bot.entityTracker?.getHostileCount() < 2) {
      this._exitEscape();
      return;
    }

    // Timed out
    if (now - this._escapeStart > ESCAPE_TIMEOUT) {
      this._exitEscape();
      return;
    }

    // Keep running
    if (this._escapeGoal) {
      const pf = this.bot.pathfinder;
      pf.setGoal(new GoalNear(
        this._escapeGoal.x,
        this._escapeGoal.y,
        this._escapeGoal.z,
        2
      ));
    } else {
      this._escapeGoal = this._computeEscapeGoal();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _computeEscapeGoal() {
    const pos     = this.bot.entity?.position;
    if (!pos) return null;

    const memory  = this.bot.memory;

    // Prefer home if known
    if (memory?.hasHome()) {
      return memory.home;
    }

    // Otherwise run away from threat cluster centroid
    const centroid = this._threatCentroid();
    if (centroid) {
      const awayDir = pos.minus(centroid).normalize();
      return pos.plus(awayDir.scaled(ESCAPE_DIST));
    }

    // Last resort: random direction
    const angle = Math.random() * Math.PI * 2;
    return new Vec3(
      pos.x + Math.cos(angle) * ESCAPE_DIST,
      pos.y,
      pos.z + Math.sin(angle) * ESCAPE_DIST
    );
  }

  _threatCentroid() {
    const et  = this.bot.entityTracker;
    const pos = this.bot.entity?.position;
    if (!et || !pos) return null;

    let sx = 0, sz = 0, count = 0;
    for (const [, t] of et.entities) {
      if (!t.isHostile || !t.isValid()) continue;
      if (t.entity.position.distanceTo(pos) > 12) continue;
      sx += t.entity.position.x;
      sz += t.entity.position.z;
      count++;
    }
    if (!count) return null;
    return new Vec3(sx / count, pos.y, sz / count);
  }

  _raiseShield() {
    if (!this.bot._shieldRaised) {
      try { this.bot.activateItem(true); } catch {}
      this.bot._shieldRaised = true;
    }
  }

  _exitEscape() {
    this.bot.setControlState('sprint', false);
    try { this.bot.deactivateItem(); } catch {}
    this.bot._shieldRaised = false;
    this.bot.pathfinder?.stop();

    console.log('[Defense] Escape complete.');
    const mode = this.sm.mode;
    this.sm.forceTransition(mode === 'protect' ? 'FOLLOW' : 'IDLE');
  }
}

module.exports = Defense;
