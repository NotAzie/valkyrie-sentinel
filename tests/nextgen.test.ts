import { describe, it, expect } from 'vitest';
import { MortonLattice } from '../src/lattice/mortonLattice';
import { BitboardMaskTable } from '../src/lattice/bitboardMask';
import { CausalHorizonInverter } from '../src/chi/causalHorizon';
import { Valkyrie } from '../src/valkyrie';

describe('Next-Gen Morton Z-Order Bitboard Lattice', () => {
  it('correctly bijectively encodes and decodes coordinates in O(1)', () => {
    const x = 142, y = 64, z = 890;
    const code = MortonLattice.encode(x, y, z);
    const decoded = MortonLattice.decode(code);

    expect(decoded.x).toBe(x);
    expect(decoded.y).toBe(y);
    expect(decoded.z).toBe(z);
  });

  it('performs O(1) bitwise neighborhood queries', () => {
    const table = new BitboardMaskTable();
    table.setVoxel(10, 64, 10, true);
    expect(table.isSolid(10, 64, 10)).toBe(true);
    expect(table.isSolid(11, 64, 10)).toBe(false);
    expect(table.checkNeighborhoodMask(11, 64, 10)).toBe(true);
  });
});

describe('Causal Horizon Inversion (CHI)', () => {
  it('projects deterministic ballistic reach cones with >95% confidence', () => {
    const cone = CausalHorizonInverter.predictReachableCone(
      { x: 10, y: 64, z: 10 },
      { x: 0.2, y: 0.4, z: 0.0 },
      false, // airborne
      2
    );

    expect(cone.deterministicConfidence).toBeGreaterThanOrEqual(0.95);
    expect(cone.centroid.x).toBeGreaterThan(10);
  });
});

describe('Monadic Action Vector Performance Benchmark', () => {
  it('executes decision cycle within sub-45-microsecond tick budget', () => {
    const snapshot = {
      botPosition: { x: 0, y: 64, z: 0 },
      botVelocity: { x: 0, y: -0.1, z: 0 },
      botHealth: 20.0,
      targetPosition: { x: 2.5, y: 64, z: 0 },
      targetVelocity: { x: 0.1, y: 0.3, z: 0 },
      targetOnGround: false,
      serverPingMs: 60,
      hazards: []
    };

    const start = performance.now();
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      Valkyrie.resolve(snapshot);
    }
    const elapsedMs = performance.now() - start;
    const microsecPerCall = (elapsedMs / iterations) * 1000;

    console.log(`[Benchmark] Monadic Action Vector throughput: ${microsecPerCall.toFixed(2)} us/call`);
    expect(microsecPerCall).toBeLessThan(45.0); // Sub-45 microseconds
  });
});
