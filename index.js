'use strict';

const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const { plugin: pvp } = require('mineflayer-pvp');
const collectblock = require('mineflayer-collectblock');

const StateManager = require('./bot/core/stateManager');
const Memory = require('./bot/core/memory');
const EventManager = require('./bot/core/eventManager');
const EntityTracker = require('./bot/perception/entityTracker');
const ChatCommands = require('./bot/commands/chatCommands');

// ── Bot config ──────────────────────────────────────────────────────────────
const BOT_CONFIG = {
  host: process.env.MC_HOST || 'localhost',
  port: parseInt(process.env.MC_PORT) || 25565,
  username: process.env.MC_USERNAME || 'CombatBot',
  version: process.env.MC_VERSION || '1.20.1',
  auth: process.env.MC_AUTH || 'offline',
};

// ── Bootstrap ───────────────────────────────────────────────────────────────
function createBot() {
  console.log('[CombatBot] Connecting to', BOT_CONFIG.host, ':', BOT_CONFIG.port);

  const bot = mineflayer.createBot(BOT_CONFIG);

  // Load plugins
  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bot.loadPlugin(collectblock.plugin);

  bot.once('spawn', () => {
    console.log('[CombatBot] Spawned. Initialising modules...');

    // Core systems
    bot.memory       = new Memory();
    bot.stateManager = new StateManager(bot);
    bot.eventManager = new EventManager(bot);
    bot.entityTracker = new EntityTracker(bot);

    // Commands (registers chat listeners)
    new ChatCommands(bot);

    // Start main loop
    bot.stateManager.start();

    bot.chat('Combat Bot online. Commands: protect, hunt, stay, return, sethome, setchest');
    console.log('[CombatBot] All modules loaded. Awaiting commands.');
  });

  bot.on('error', (err) => {
    console.error('[CombatBot] Error:', err.message);
  });

  bot.on('kicked', (reason) => {
    console.log('[CombatBot] Kicked:', reason);
    setTimeout(createBot, 5000);
  });

  bot.on('end', () => {
    console.log('[CombatBot] Disconnected. Reconnecting in 5s...');
    setTimeout(createBot, 5000);
  });

  return bot;
}

createBot();
