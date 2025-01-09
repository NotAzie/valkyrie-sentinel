'use strict';

/**
 * ChatCommands — registers and handles all player chat commands.
 *
 * Commands:
 *   protect   — follow + defend player
 *   hunt      — independent hunting mode
 *   stay      — idle, stop moving
 *   return    — go home and store items
 *   sethome   — set home to current position
 *   setchest  — set chest to block looking at
 *   status    — report current state, health, food
 *   help      — list commands
 */

class ChatCommands {
  constructor(bot) {
    this.bot = bot;
    this._register();
  }

  _register() {
    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;
      this._handle(username, message.trim().toLowerCase());
    });
  }

  _handle(username, msg) {
    const bot = this.bot;
    const sm  = bot.stateManager;

    switch (msg) {

      // ── Mode commands ──────────────────────────────────────────────────
      case 'protect':
        sm.setMode('protect');
        bot.chat(`Protecting ${username}. I'll keep you safe.`);
        break;

      case 'hunt':
        sm.setMode('hunt');
        bot.chat('Hunting mode activated. Heading out.');
        break;

      case 'stay':
      case 'idle':
        sm.setMode('idle');
        bot.chat('Standing by.');
        break;

      case 'return':
        sm.setMode('idle');
        sm.forceTransition('RETURN_HOME');
        bot.chat('Returning home to store items.');
        break;

      // ── Location setup ─────────────────────────────────────────────────
      case 'sethome': {
        const pos = bot.entity?.position;
        if (!pos) { bot.chat('Cannot determine position.'); break; }
        bot.memory.setHome(pos);
        bot.chat(`Home set at ${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}.`);
        break;
      }

      case 'setchest': {
        const ref = bot.blockAtCursor(5);
        if (!ref || !ref.name.includes('chest')) {
          bot.chat('Look at a chest and type setchest.');
          break;
        }
        bot.memory.setChest(ref.position);
        bot.chat(`Chest registered at ${ref.position.x}, ${ref.position.y}, ${ref.position.z}.`);
        break;
      }

      // ── Info ────────────────────────────────────────────────────────────
      case 'status': {
        const state  = sm.state;
        const mode   = sm.mode;
        const health = Math.round(bot.health  ?? 0);
        const food   = Math.round(bot.food    ?? 0);
        const items  = bot.inventory?.items()?.length ?? 0;
        bot.chat(`State: ${state} | Mode: ${mode} | HP: ${health}/20 | Food: ${food}/20 | Items: ${items}`);
        break;
      }

      case 'help':
        bot.chat('Commands: protect | hunt | stay | return | sethome | setchest | status | help');
        break;

      default:
        // Not a recognised command — ignore
        break;
    }
  }
}

module.exports = ChatCommands;
