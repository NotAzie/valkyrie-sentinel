import { describe, it, expect } from 'vitest';
import { AdversarialIntentDecoder } from '../src/ai/adversarialDecoder';
import { WavefrontMeshCoordinator } from '../src/swarm/wavefrontMesh';
import { MemoryArena } from '../src/memory/memoryArena';

describe('Adversarial Intent Decoder (AID)', () => {
  it('correctly classifies sudden deceleration as BAIT_FEINT', () => {
    const aid = new AdversarialIntentDecoder();
    aid.updateObservation({ x: 0.3, y: 0, z: 0.3 });
    aid.updateObservation({ x: 0.35, y: 0, z: 0.35 });
    const evalResult = aid.updateObservation({ x: 0.02, y: 0, z: 0.02 });

    expect(evalResult.predictedState).toBe('BAIT_FEINT');
    expect(evalResult.isFeinting).toBe(true);
    expect(evalResult.recommendedSpacingRadius).toBeGreaterThan(3.0);
  });
});

describe('Continuous Wavefront Swarm Mesh', () => {
  it('computes balanced encirclement vectors around common target', () => {
    const target = { x: 0, y: 64, z: 0 };
    const agent = { x: 5, y: 64, z: 0 };
    const peer = { nodeId: 'peer-2', position: { x: -5, y: 64, z: 0 }, targetId: 't1' };

    const vector = WavefrontMeshCoordinator.computeEncirclementVector(agent, target, [peer], 3.5);
    expect(vector.x).toBeLessThan(0); // Vector points inward toward target
  });
});

describe('Continuous Flat Memory Arena', () => {
  it('allocates aligned slices without exceeding capacity', () => {
    const arena = MemoryArena.getGlobal();
    arena.reset();

    const ptr1 = arena.allocate(100);
    const ptr2 = arena.allocate(250);

    expect(ptr1).toBe(0);
    expect(ptr2).toBe(104); // Aligned to 8 bytes
  });
});
