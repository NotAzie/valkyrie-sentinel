'use strict';

/**
 * Sub-tick Totem of Undying hot-swap controller.
 * Bypasses GUI animations using instant inventory packet transactions.
 */
class TotemSwap {
  constructor(bot, emergencyHealthThreshold = 8.0) {
    this.bot = bot;
    this.threshold = emergencyHealthThreshold;
    this.isSwapping = false;
  }

  checkAndSwap() {
    if (this.isSwapping) return;
    if (this.bot.health > this.threshold) return;

    const offhand = this.bot.inventory.slots[45];
    if (offhand && offhand.name === 'totem_of_undying') return;

    const totem = this.bot.inventory.items().find(i => i.name === 'totem_of_undying');
    if (!totem) return;

    this.isSwapping = true;
    this.bot.equip(totem, 'off-hand')
      .catch(err => console.warn(`[TotemSwap] Offhand equip failed: ${err.message}`))
      .finally(() => {
        this.isSwapping = false;
      });
  }
}

module.exports = TotemSwap;
