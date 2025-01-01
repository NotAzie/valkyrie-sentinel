'use strict';

/**
 * TargetSelector — dynamic priority scoring for combat targets.
 *
 * Scores are recalculated every combat tick to allow reactive target switching.
 * Switching only happens if new target score significantly exceeds current.
 */

const SWITCH_THRESHOLD = 20; // score delta needed to switch targets mid-combat

class TargetSelector {
  constructor(bot) {
    this.bot           = bot;
    this.currentTarget = null;
    this.lastSwitchAt  = 0;
  }

  /**
   * Returns best target for the current context.
   * If already fighting someone, only switches if a much better target appears.
   */
  selectTarget() {
    const et = this.bot.entityTracker;
    if (!et) return null;

    const best = et.getHighestPriorityTarget();
    if (!best) {
      this.currentTarget = null;
      return null;
    }

    if (!this.currentTarget || !this.currentTarget.isValid) {
      this.currentTarget = best;
      return best;
    }

    // Current target still valid?
    if (!this.currentTarget?.isValid) {
      this.currentTarget = best;
      return best;
    }

    // Don't switch too frequently
    if (Date.now() - this.lastSwitchAt < 1500) return this.currentTarget;

    const botPos     = this.bot.entity.position;
    const curScore   = this._score(this.currentTarget, botPos);
    const bestScore  = this._score(best, botPos);

    if (bestScore - curScore > SWITCH_THRESHOLD) {
      console.log(`[TargetSelector] Switching target: ${this.currentTarget.name} → ${best.name}`);
      this.currentTarget = best;
      this.lastSwitchAt  = Date.now();
    }

    return this.currentTarget;
  }

  selectHuntTarget() {
    const et = this.bot.entityTracker;
    if (!et) return null;
    const t = et.getBestHuntTarget();
    this.currentTarget = t;
    return t;
  }

  clearTarget() {
    this.currentTarget = null;
  }

  _score(entity, botPos) {
    if (!entity?.isValid || !entity.position) return -999;
    const dist = entity.position.distanceTo(botPos);
    const name = entity.name?.toLowerCase().replace('minecraft:', '') ?? '';

    const THREAT_MAP = {
      creeper: 90, skeleton: 80, stray: 80, cave_spider: 70,
      baby_zombie: 70, witch: 65, spider: 55, zombie: 50, husk: 50,
      drowned: 50, pillager: 85, vindicator: 85, phantom: 65,
    };
    const PASSIVE_MAP = {
      cow: 60, pig: 50, sheep: 55, chicken: 40, rabbit: 35,
    };

    const base    = THREAT_MAP[name] ?? PASSIVE_MAP[name] ?? 20;
    const distPen = dist * 1.5;
    const creeper = name === 'creeper' ? 20 : 0;

    return base - distPen + creeper;
  }
}

module.exports = TargetSelector;
