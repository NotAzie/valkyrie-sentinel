'use strict';

/**
 * Collect — COLLECT state handler.
 *
 * Walks to and picks up nearby dropped items.
 * Reverts to previous mode when done.
 */

const { goals: { GoalNear } } = require('mineflayer-pathfinder');

const MAX_COLLECT_TIME = 8000; // Give up collecting after this long

class Collect {
  constructor(bot, stateManager) {
    this.bot         = bot;
    this.sm          = stateManager;
    this._startedAt  = 0;
    this._currentLoot = null;
  }

  enter() {
    console.log('[Collect] Collecting nearby drops.');
    this._startedAt   = Date.now();
    this._currentLoot = null;
  }

  tick() {
    // Safety timeout
    if (Date.now() - this._startedAt > MAX_COLLECT_TIME) {
      this._done();
      return;
    }

    const lootItems = this.bot.entityTracker?.getNearbyLoot() ?? [];

    if (lootItems.length === 0) {
      this._done();
      return;
    }

    const botPos = this.bot.entity?.position;
    if (!botPos) return;

    // Pick closest item
    let closest = null, closestDist = Infinity;
    for (const item of lootItems) {
      if (!item?.isValid || !item.position) continue;
      const d = item.position.distanceTo(botPos);
      if (d < closestDist) { closestDist = d; closest = item; }
    }

    if (!closest) {
      this._done();
      return;
    }

    // Walk to it — Mineflayer auto-picks up items on proximity
    this.bot.pathfinder.setGoal(new GoalNear(
      closest.position.x,
      closest.position.y,
      closest.position.z,
      1
    ));
  }

  _done() {
    this.bot.pathfinder.stop();
    const mode = this.sm.mode;
    this.sm.forceTransition(mode === 'protect' ? 'FOLLOW' : 'HUNT');
  }
}

module.exports = Collect;
