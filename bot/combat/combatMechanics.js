'use strict';

/**
 * High-performance combat micro-mechanics.
 * Implements packet-timed W-tapping and critical hit downward trajectory alignment.
 */
class CombatMechanics {
  constructor(bot) {
    this.bot = bot;
    this.lastHitTick = 0;
    this.isWtapping = false;
  }

  shouldCriticalStrike() {
    const vel = this.bot.entity.velocity;
    // Critical condition in Minecraft 1.9+: falling, not on ground, not in water/ladder/web, no blindness
    return vel.y < -0.08 && !this.bot.entity.isInWater && !this.bot.entity.isInLava;
  }

  async executeWTap() {
    if (this.isWtapping) return;
    this.isWtapping = true;

    // Reset sprint packet
    this.bot.setControlState('sprint', false);
    this.bot.setControlState('forward', false);

    // Wait 1 server tick (~50ms)
    await new Promise(res => setTimeout(res, 50));

    this.bot.setControlState('forward', true);
    this.bot.setControlState('sprint', true);
    this.isWtapping = false;
  }

  computeAttackDelay(heldItemName) {
    if (!heldItemName) return 625;
    if (heldItemName.includes('axe')) return 1000;
    if (heldItemName.includes('pickaxe')) return 833;
    if (heldItemName.includes('shovel')) return 1000;
    if (heldItemName.includes('sword')) return 625;
    return 625;
  }
}

module.exports = CombatMechanics;
