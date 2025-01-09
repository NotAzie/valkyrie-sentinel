'use strict';

/**
 * ReturnHome — RETURN_HOME state handler.
 *
 * Navigates bot back to stored home position.
 * Triggers STORE_ITEMS on arrival.
 */

const { goals: { GoalNear } } = require('mineflayer-pathfinder');

const ARRIVE_RADIUS  = 3;
const TIMEOUT_MS     = 60_000;
const REPATH_DIST    = 3; // If stuck closer than this to goal, we've arrived

class ReturnHome {
  constructor(bot, stateManager) {
    this.bot        = bot;
    this.sm         = stateManager;
    this._startedAt = 0;
    this._lastPos   = null;
    this._stuckTime = 0;
  }

  enter() {
    const mem = this.bot.memory;
    if (!mem?.hasHome()) {
      this.bot.chat('No home set. Use "sethome" near your base.');
      this.sm.forceTransition('IDLE');
      return;
    }

    console.log('[ReturnHome] Navigating home:', mem.home);
    this._startedAt = Date.now();
    this._stuckTime = 0;
    this._navigate();
  }

  tick() {
    const mem = this.bot.memory;
    if (!mem?.hasHome()) { this.sm.forceTransition('IDLE'); return; }

    if (Date.now() - this._startedAt > TIMEOUT_MS) {
      this.bot.chat('Could not reach home in time. Resuming task.');
      this._resume();
      return;
    }

    const pos  = this.bot.entity?.position;
    if (!pos) return;

    const dist = pos.distanceTo(mem.home);
    if (dist < ARRIVE_RADIUS) {
      console.log('[ReturnHome] Arrived home.');
      this.bot.pathfinder.stop();
      this.sm.forceTransition('STORE_ITEMS');
      return;
    }

    // Stuck check
    if (this._lastPos) {
      const moved = pos.distanceTo(this._lastPos);
      if (moved < 0.3) {
        this._stuckTime += 300;
        if (this._stuckTime > 4000) {
          this._handleStuck();
          this._stuckTime = 0;
        }
      } else {
        this._stuckTime = 0;
      }
    }
    this._lastPos = pos.clone();
  }

  _navigate() {
    const home = this.bot.memory.home;
    this.bot.pathfinder.setGoal(new GoalNear(home.x, home.y, home.z, ARRIVE_RADIUS));
  }

  _handleStuck() {
    console.log('[ReturnHome] Stuck! Attempting recovery...');
    this.bot.setControlState('jump', true);
    setTimeout(() => {
      this.bot.setControlState('jump', false);
      this._navigate();
    }, 500);
  }

  _resume() {
    this.bot.pathfinder.stop();
    this.sm.forceTransition(this.sm.mode === 'protect' ? 'FOLLOW' : 'HUNT');
  }
}

module.exports = ReturnHome;
