'use strict';

/**
 * Hunt — HUNT state handler.
 *
 * Roams independently to find and kill mobs/animals.
 * Collects drops after kills.
 * Returns when inventory threshold reached.
 */

const { goals: { GoalNear } } = require('mineflayer-pathfinder');
const TargetSelector = require('../combat/targetSelector');

const ROAM_RADIUS      = 40;
const ROAM_PAUSE_MIN   = 1500;
const ROAM_PAUSE_MAX   = 4000;
const HUNT_SCAN_RADIUS = 24;

class Hunt {
  constructor(bot, stateManager) {
    this.bot      = bot;
    this.sm       = stateManager;
    this.selector = new TargetSelector(bot);
    this._roamTarget   = null;
    this._roamPauseEnd = 0;
    this._huntOrigin   = null;
  }

  enter() {
    console.log('[Hunt] Entering HUNT mode. Roaming for targets.');
    this._huntOrigin  = this.bot.entity?.position?.clone() ?? null;
    this._pickRoamTarget();
  }

  tick() {
    const target = this.selector.selectHuntTarget();

    if (target) {
      // Engage — let state machine route to COMBAT
      this.sm.transition('COMBAT');
      return;
    }

    // No target — roam
    this._roam();
  }

  _roam() {
    const now = Date.now();

    // Already moving toward a goal?
    if (this._roamTarget) {
      const pos  = this.bot.entity?.position;
      if (!pos) return;
      const dist = pos.distanceTo(this._roamTarget);

      if (dist < 3) {
        // Arrived — pause briefly then pick new spot
        this.bot.pathfinder.stop();
        this._roamTarget  = null;
        this._roamPauseEnd = now + ROAM_PAUSE_MIN + Math.random() * (ROAM_PAUSE_MAX - ROAM_PAUSE_MIN);
        return;
      }

      // Still traveling — check stuck
      return;
    }

    if (now < this._roamPauseEnd) return;  // waiting

    this._pickRoamTarget();
  }

  _pickRoamTarget() {
    const origin = this._huntOrigin ?? this.bot.entity?.position;
    if (!origin) return;

    const angle = Math.random() * Math.PI * 2;
    const dist  = ROAM_RADIUS * 0.4 + Math.random() * ROAM_RADIUS * 0.6;

    this._roamTarget = origin.offset(
      Math.cos(angle) * dist,
      0,
      Math.sin(angle) * dist
    );

    this.bot.pathfinder.setGoal(new GoalNear(
      this._roamTarget.x,
      this._roamTarget.y,
      this._roamTarget.z,
      2
    ));
  }
}

module.exports = Hunt;
