import { Valkyrie } from '../src/valkyrie';

console.log('[Benchmark] Initializing synthetic spatial load test...');

const snapshot = {
  botPosition: { x: 0, y: 64, z: 0 },
  botVelocity: { x: 0, y: -0.1, z: 0 },
  botHealth: 20.0,
  targetPosition: { x: 2.8, y: 64, z: 0.1 },
  targetVelocity: { x: 0.15, y: 0.25, z: 0 },
  targetOnGround: false,
  serverPingMs: 40,
  hazards: []
};

const iterations = 50000;
const start = performance.now();

for (let i = 0; i < iterations; i++) {
  Valkyrie.resolve(snapshot);
}

const elapsed = performance.now() - start;
const perCallUs = (elapsed / iterations) * 1000;

console.log(`[Benchmark] Completed ${iterations} iterations in ${elapsed.toFixed(2)} ms.`);
console.log(`[Benchmark] Mean Decision Latency: ${perCallUs.toFixed(2)} us/cycle.`);
