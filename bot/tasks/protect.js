'use strict';

/**
 * Protect — FOLLOW state handler.
 *
 * Follows the player closely (2–4 blocks).
 * Scans for threats around the player and triggers COMBAT if needed.
 */

const { goals: { GoalFollow } } = require('mineflayer-pathfinder');

const FOLLOW_DISTANCE    = 2;
const THREAT_SCAN_RADIUS = 16;

class Protect {
  constructor(bot, stateManager) {
    this.bot = bot;
    this.sm  = stateManager;
  }

  enter() {
    console.log('[Protect] Following player.');
  }

  tick() {
    const player = this._getPlayer();
    if (!player) {
      // Player offline or not found
      this.bot.pathfinder.stop();
      return;
    }

    // Follow
    this.bot.pathfinder.setGoal(new GoalFollow(player, FOLLOW_DISTANCE), true);

    // Check for threats near player
    const threat = this.bot.entityTracker?.getHighestPriorityTarget();
    if (threat) {
      const distToPlayer = threat.position.distanceTo(player.position);
      if (distToPlayer < THREAT_SCAN_RADIUS) {
        this.sm.transition('COMBAT');
      }
    }
  }

  _getPlayer() {
    // Attempt to find the player who issued the protect command.
    // Fallback: any player in range.
    const players = Object.values(this.bot.players);
    for (const p of players) {
      if (p.username !== this.bot.username && p.entity) return p.entity;
    }
    return null;
  }
}

module.exports = Protect;
