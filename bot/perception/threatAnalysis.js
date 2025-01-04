'use strict';

/**
 * ThreatAnalysis — utility functions for evaluating threats.
 * Used by combat modules to make tactical decisions.
 */

class ThreatAnalysis {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Returns true if the situation is overwhelmingly dangerous.
   */
  isOverwhelmed() {
    const health       = this.bot.health ?? 20;
    const hostileCount = this.bot.entityTracker?.getHostileCount() ?? 0;
    return health < 8 && hostileCount >= 4;
  }

  /**
   * Returns a "pressure score" representing how dangerous the current
   * situation is. Higher = more dangerous.
   */
  pressureScore() {
    const health       = this.bot.health ?? 20;
    const food         = this.bot.food   ?? 20;
    const hostileCount = this.bot.entityTracker?.getHostileCount() ?? 0;

    const healthPressure = (20 - health) * 2;
    const foodPressure   = food < 8 ? (8 - food) * 1.5 : 0;
    const mobPressure    = hostileCount * 10;

    return healthPressure + foodPressure + mobPressure;
  }

  /**
   * Quick check: should bot be in defensive / cautious mode?
   */
  shouldBeCautious() {
    return this.pressureScore() > 30;
  }

  /**
   * Is a specific entity a creeper about to explode?
   */
  isCreeperFusing(entity) {
    return entity?.name === 'creeper' && entity?.metadata?.[16] === true;
  }
}

module.exports = ThreatAnalysis;
