import { TelemetryDashboardServer } from '../src/dashboard/server';
import { Valkyrie } from '../src/valkyrie';
import { CausalHorizonInverter } from '../src/chi/causalHorizon';
import { FastMath } from '../src/math/fastMath';

interface SimEntity {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  health: number;
  maxHealth: number;
  isHostile: boolean;
}

async function runSimulation() {
  console.log('================================================================================');
  console.log('VALKYRIE SENTINEL // HEADLESS BATTLE ARENA SIMULATION');
  console.log('Initializing 20 Hz synthetic physics arena & WebGL Tactical Radar HUD...');
  console.log('================================================================================');

  const dashboard = new TelemetryDashboardServer(3000);
  await dashboard.start();

  console.log('\n--> Open your browser at http://localhost:3000 to view live 360-degree radar blips.');
  console.log('--> Press Ctrl+C in terminal to stop simulation.\n');

  // Simulated Valkyrie agent state
  const agent = {
    x: 0,
    y: 64,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    health: 20.0
  };

  // Synthetic enemy entities in the arena
  const entities: SimEntity[] = [
    { id: 101, name: 'Zombie_Alpha', x: 12, y: 64, z: 8, vx: -0.15, vy: 0, vz: -0.1, health: 20, maxHealth: 20, isHostile: true },
    { id: 102, name: 'Skeleton_Sniper', x: -18, y: 64, z: 14, vx: 0.1, vy: 0, vz: -0.12, health: 20, maxHealth: 20, isHostile: true },
    { id: 103, name: 'Creeper_Kamikaze', x: 5, y: 64, z: -16, vx: -0.05, vy: 0, vz: 0.2, health: 20, maxHealth: 20, isHostile: true },
    { id: 104, name: 'Hostile_Duelist', x: -8, y: 64, z: -10, vx: 0.22, vy: 0.1, vz: 0.18, health: 20, maxHealth: 20, isHostile: true },
    { id: 105, name: 'Allied_Sentry', x: 20, y: 64, z: 22, vx: -0.05, vy: 0, vz: -0.05, health: 20, maxHealth: 20, isHostile: false }
  ];

  let tickCount = 0;

  const interval = setInterval(() => {
    tickStart(performance.now());
  }, 50);

  function tickStart(startTime: number) {
    tickCount++;

    // 1. Update synthetic entity physics (orbital wander + Minecraft drag)
    for (const ent of entities) {
      if (ent.health <= 0) {
        // Respawn eliminated entities on arena boundary
        ent.health = ent.maxHealth;
        const angle = Math.random() * Math.PI * 2;
        ent.x = Math.cos(angle) * 25;
        ent.z = Math.sin(angle) * 25;
        continue;
      }

      if (ent.isHostile) {
        // Hostile entities accelerate toward agent
        const dx = agent.x - ent.x;
        const dz = agent.z - ent.z;
        const dist = FastMath.fastNorm3D(dx, 0, dz);
        if (dist > 1.0) {
          ent.vx += (dx / dist) * 0.04;
          ent.vz += (dz / dist) * 0.04;
        }
      }

      // Physics damping
      ent.vx *= 0.88;
      ent.vz *= 0.88;
      ent.x += ent.vx;
      ent.z += ent.vz;
    }

    // 2. Select highest threat target (closest hostile)
    let closestHostile: SimEntity | null = null;
    let minDist = Infinity;

    for (const ent of entities) {
      if (!ent.isHostile || ent.health <= 0) continue;
      const d = FastMath.fastDistance3D(agent.x, agent.y, agent.z, ent.x, ent.y, ent.z);
      if (d < minDist) {
        minDist = d;
        closestHostile = ent;
      }
    }

    // 3. Evaluate Valkyrie Monadic Action Vector
    const snapshot = {
      botPosition: { x: agent.x, y: agent.y, z: agent.z },
      botVelocity: { x: agent.vx, y: agent.vy, z: agent.vz },
      botHealth: agent.health,
      targetPosition: closestHostile ? { x: closestHostile.x, y: closestHostile.y, z: closestHostile.z } : null,
      targetVelocity: closestHostile ? { x: closestHostile.vx, y: closestHostile.vy, z: closestHostile.vz } : null,
      targetOnGround: true,
      serverPingMs: 35,
      hazards: []
    };

    const impulse = Valkyrie.resolve(snapshot);

    // 4. Apply impulse to agent
    agent.vx = impulse.movementVelocity.x * 0.28; // Sprint speed ~5.6 m/s -> 0.28 b/t
    agent.vz = impulse.movementVelocity.z * 0.28;
    agent.x += agent.vx;
    agent.z += agent.vz;

    // 5. Combat hit resolution
    if (impulse.shouldAttack && closestHostile && minDist <= 3.0000) {
      closestHostile.health -= impulse.criticalStrikeReady ? 9.0 : 6.0;
      // Knockback packet
      closestHostile.vx += (closestHostile.x - agent.x) * 0.15;
      closestHostile.vz += (closestHostile.z - agent.z) * 0.15;
    }

    const elapsed = performance.now() - startTime;

    // 6. Update Web Dashboard
    dashboard.updateTelemetry({
      state: closestHostile ? (minDist <= 3.5 ? 'COMBAT_ENGAGE' : 'APPROACH') : 'PATROL',
      health: agent.health,
      tickLatencyMs: elapsed,
      activeTargets: entities.filter(e => e.isHostile && e.health > 0).length,
      targetLock: closestHostile ? `${closestHostile.name} [Dist: ${minDist.toFixed(1)}m | HP: ${closestHostile.health.toFixed(0)}]` : 'NONE'
    });

    if (tickCount % 40 === 0 && closestHostile) {
      console.log(`[Sim Tick #${tickCount}] Target: ${closestHostile.name} | Dist: ${minDist.toFixed(2)}m | Resolve Latency: ${(elapsed * 1000).toFixed(1)} us`);
    }
  }

  process.on('SIGINT', async () => {
    clearInterval(interval);
    await dashboard.stop();
    console.log('\n[Simulation] Stopped cleanly.');
    process.exit(0);
  });
}

runSimulation().catch(err => {
  console.error('[Simulation] Error:', err);
});
