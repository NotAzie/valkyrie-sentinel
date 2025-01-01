'use strict';

/**
 * MovementCombat — handles RETREAT state.
 *
 * Triggered when HP < 5 but not critical.
 * Strategy: back away from enemy, heal, then re-engage.
 */

const { goals: { GoalNear } } = require('mineflayer-pathfinder');

const RETREAT_HP_THRESHOLD    = 5;
const REENTER_COMBAT_HP       = 10;
const RETREAT_DISTANCE        = 12;

class MovementCombat {
  constructor(bot, stateManager) {
    this.bot = bot;
    this.sm  = stateManager;
  }

  enter() {
    console.log('[Retreat] Retreating to recover...');
    this.bot.setControlState('sprint', true);
    this._retreatFrom(this.bot.entityTracker?.getHighestPriorityTarget());
  }

  tick() {
    const health = this.bot.health ?? 20;

    // Eat if possible while retreating
    if (this.bot.food < 16 && health < 20) {
      const fm = this.bot._foodManager;
      if (fm) fm.tryEat();
    }

    // Recovered? Resume
    if (health >= REENTER_COMBAT_HP) {
      this.bot.setControlState('sprint', false);
      this.bot.pathfinder?.stop();
      console.log('[Retreat] Recovered. Resuming.');
      this.sm.forceTransition(
        this.sm.mode === 'protect' ? 'FOLLOW' : 'HUNT'
      );
      return;
    }

    // Still in danger — keep retreating
    const target = this.bot.entityTracker?.getHighestPriorityTarget();
    if (target) {
      this._retreatFrom(target);
    }
  }

  _retreatFrom(threat) {
    if (!threat || !this.bot.entity) return;
    const pos     = this.bot.entity.position;
    const tPos    = threat.position;
    const awayDir = pos.minus(tPos).normalize();
    const goal    = pos.plus(awayDir.scaled(RETREAT_DISTANCE));

    this.bot.pathfinder?.setGoal(new GoalNear(goal.x, goal.y, goal.z, 2));
  }
}

module.exports = MovementCombat;
