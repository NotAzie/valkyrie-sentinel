'use strict';

/**
 * Scanner — lightweight supplemental scanner.
 *
 * Performs a light refresh of the entity tracker from bot.entities
 * every N seconds to catch any entities missed by events.
 * Not a heavy per-tick loop.
 */

const REFRESH_INTERVAL_MS = 3000;

class Scanner {
  constructor(bot) {
    this.bot = bot;
    this._interval = setInterval(() => this._refresh(), REFRESH_INTERVAL_MS);
  }

  _refresh() {
    const et = this.bot.entityTracker;
    if (!et) return;

    for (const entity of Object.values(this.bot.entities)) {
      // Only re-track if not already tracked
      if (!et.entities.has(entity.id)) {
        et.onSpawn(entity);
      }
    }
  }

  stop() {
    clearInterval(this._interval);
  }
}

module.exports = Scanner;
