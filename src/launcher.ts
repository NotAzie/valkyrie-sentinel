import * as mineflayer from 'mineflayer';
import { pathfinder } from 'mineflayer-pathfinder';
import { plugin as pvp } from 'mineflayer-pvp';
import * as collectblock from 'mineflayer-collectblock';

import { MineflayerSpatialDriver } from './drivers/mineflayer/mineflayerDriver';
import { createValkyrieAgent } from './sdk';
import { TelemetryDashboardServer } from './dashboard/server';

const CONFIG = {
  host: process.env.MC_HOST || 'localhost',
  port: parseInt(process.env.MC_PORT || '25565', 10),
  username: process.env.MC_USERNAME || 'ValkyrieSentinel',
  version: process.env.MC_VERSION || '1.20.1',
  auth: (process.env.MC_AUTH as 'offline' | 'microsoft') || 'offline',
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || '3000', 10)
};

async function bootstrap() {
  console.log('================================================================================');
  console.log('VALKYRIE SENTINEL // AUTONOMOUS FOUNDATION ENGINE');
  console.log(`Connecting to: ${CONFIG.host}:${CONFIG.port} as ${CONFIG.username} (v${CONFIG.version})`);
  console.log('================================================================================');

  // Start telemetry dashboard
  const dashboard = new TelemetryDashboardServer(CONFIG.dashboardPort);
  try {
    await dashboard.start();
  } catch (err: any) {
    console.warn(`[Launcher] Dashboard failed to bind to port ${CONFIG.dashboardPort}: ${err.message}`);
  }

  // Create Mineflayer instance
  const bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    auth: CONFIG.auth
  });

  bot.loadPlugin(pathfinder);
  bot.loadPlugin(pvp);
  bot.loadPlugin(collectblock.plugin);

  const driver = new MineflayerSpatialDriver(bot as any);
  const agent = createValkyrieAgent(driver);

  bot.once('spawn', () => {
    console.log('[Valkyrie] Client successfully spawned in game simulation.');
    console.log('[Valkyrie] Initializing Causal Horizon Inversion & 20 Hz Autonomous Cognition Loop...');

    dashboard.updateTelemetry({
      state: 'ACTIVE_COGNITION',
      health: bot.health || 20.0,
      activeTargets: Object.keys(bot.entities).length
    });

    agent.startAutonomousLoop(20);

    bot.chat('[Valkyrie Sentinel V1.0.0 Online] Continuous Geodesic Navigation Engaged.');
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;

    if (message === '!status') {
      bot.chat(`[Valkyrie] Health: ${(bot.health || 20).toFixed(1)}/20 | Entities Tracked: ${Object.keys(bot.entities).length}`);
    } else if (message === '!halt') {
      agent.stop();
      dashboard.updateTelemetry({ state: 'HALTED' });
      bot.chat('[Valkyrie] Autonomous loop halted.');
    } else if (message === '!engage') {
      agent.startAutonomousLoop(20);
      dashboard.updateTelemetry({ state: 'ENGAGED' });
      bot.chat('[Valkyrie] Autonomous loop engaged.');
    }
  });

  bot.on('health', () => {
    dashboard.updateTelemetry({ health: bot.health });
  });

  bot.on('kicked', (reason) => {
    console.warn(`[Valkyrie] Kicked from server: ${reason}`);
    dashboard.updateTelemetry({ state: 'DISCONNECTED' });
  });

  bot.on('error', (err) => {
    console.error(`[Valkyrie] Network error: ${err.message}`);
  });

  const shutdown = async () => {
    console.log('\n[Valkyrie] Shutting down gracefully...');
    agent.stop();
    await dashboard.stop();
    bot.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error(`[Launcher] Fatal bootstrap error: ${err.message}`);
    process.exit(1);
  });
}

export { bootstrap };
