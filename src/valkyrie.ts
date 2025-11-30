import { MonadicActionResolver, WorldSnapshot, MonadicActionVector } from './kernel/monadicResolver';

/**
 * Radical Simplification: The Top-Level Valkyrie Interface.
 * The entirety of the continuous spatial perception, kinematics, causal horizon inversion,
 * and packet synchronization collapses into a single static method.
 *
 * Example:
 * const impulse = Valkyrie.resolve(snapshot);
 */
export class Valkyrie {
  public static resolve(world: WorldSnapshot): MonadicActionVector {
    return MonadicActionResolver.resolve(world);
  }
}
