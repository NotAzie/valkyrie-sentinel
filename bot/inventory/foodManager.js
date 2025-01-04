'use strict';

/**
 * FoodManager — EAT state handler + utility for eating mid-task.
 */

const FOOD_PRIORITY = [
  'cooked_beef', 'steak',
  'cooked_porkchop',
  'cooked_mutton',
  'cooked_chicken',
  'bread',
  'apple',
  'golden_apple',
  'carrot',
  'potato',
];

const EAT_BELOW_FOOD   = 16;
const STOP_EAT_FOOD    = 20;
const EAT_TIMEOUT_MS   = 3000;

class FoodManager {
  constructor(bot, stateManager) {
    this.bot      = bot;
    this.sm       = stateManager;
    this._eating  = false;
    this._eatStart = 0;
  }

  enter() {
    console.log('[Food] Eating...');
    this.tryEat();
  }

  tick() {
    const food   = this.bot.food   ?? 20;
    const health = this.bot.health ?? 20;

    // Timeout guard
    if (this._eating && Date.now() - this._eatStart > EAT_TIMEOUT_MS) {
      this._eating = false;
      this._exitEat();
      return;
    }

    if (food >= STOP_EAT_FOOD && health >= 20) {
      this._exitEat();
      return;
    }

    if (!this._eating) this.tryEat();
  }

  async tryEat() {
    if (this._eating) return;
    const foodItem = this._findFood();
    if (!foodItem) return;

    this._eating   = true;
    this._eatStart = Date.now();

    try {
      await this.bot.equip(foodItem, 'hand');
      this.bot.activateItem();
      await new Promise(r => setTimeout(r, 1600)); // eating animation ~1.6s
      this.bot.deactivateItem();
    } catch {}

    this._eating = false;
  }

  _findFood() {
    const items = this.bot.inventory.items();
    for (const name of FOOD_PRIORITY) {
      const found = items.find(i => i.name === name || i.name.includes(name));
      if (found) return found;
    }
    return null;
  }

  _exitEat() {
    this.bot.pathfinder?.stop();
    const mode = this.sm.mode;
    if (mode === 'protect')      this.sm.forceTransition('FOLLOW');
    else if (mode === 'hunt')    this.sm.forceTransition('HUNT');
    else                          this.sm.forceTransition('IDLE');
  }
}

module.exports = FoodManager;
