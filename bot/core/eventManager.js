'use strict';

/**
 * EventManager — wires up Mineflayer events and delegates to subsystems.
 * Uses event-driven perception rather than per-tick scans.
 */
class EventManager {
  constructor(bot) {
    this.bot = bot;
    this._register();
  }

  _register() {
    const bot = this.bot;

    // ── Entity lifecycle ───────────────────────────────────────────────────
    bot.on('entitySpawn',   (e) => bot.entityTracker?.onSpawn(e));
    bot.on('entityMoved',   (e) => bot.entityTracker?.onMove(e));
    bot.on('entityGone',    (e) => bot.entityTracker?.onGone(e));
    bot.on('entityHurt',    (e) => bot.entityTracker?.onHurt(e));

    // ── Bot health / food ──────────────────────────────────────────────────
    bot.on('health', () => {
      const sm = bot.stateManager;
      if (!sm) return;
      if (bot.health <= 3) {
        sm.forceTransition('ESCAPE');
      } else if (bot.health < 5 && sm.state !== 'ESCAPE') {
        sm.transition('RETREAT');
      }
    });

    // ── Item drops (loot pickup signal) ───────────────────────────────────
    bot.on('entitySpawn', (entity) => {
      if (entity.name === 'item') {
        bot.entityTracker?.onLootSpawn(entity);
      }
    });

    // ── Death ─────────────────────────────────────────────────────────────
    bot.on('death', () => {
      console.log('[EventManager] Bot died!');
      bot.stateManager?.forceTransition('IDLE');
    });

    // ── Wake / sleep ───────────────────────────────────────────────────────
    bot.on('wake', () => {
      if (bot.stateManager?.mode === 'protect') {
        bot.stateManager.forceTransition('FOLLOW');
      }
    });
  }
}

module.exports = EventManager;
