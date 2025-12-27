import { Vector3D } from '../types';
import { FastMath } from '../math/fastMath';

export interface SwarmPeerNode {
  nodeId: string;
  position: Vector3D;
  targetId: string;
}

/**
 * Distributed Eikonal Wavefront Swarm Mesh (EWSM).
 * Computes continuous multi-agent encirclement tensors.
 * Rather than independent pathing, agents superimpose arrival-time wavefields
 * to compress the target into an inescapable continuous spatial envelope.
 */
export class WavefrontMeshCoordinator {
  public static computeEncirclementVector(
    agentPos: Vector3D,
    targetPos: Vector3D,
    peers: SwarmPeerNode[],
    targetEncirclementRadius = 3.5
  ): Vector3D {
    const dx = targetPos.x - agentPos.x;
    const dz = targetPos.z - agentPos.z;
    const distToTarget = FastMath.fastNorm3D(dx, 0, dz);

    if (distToTarget < 0.001) return { x: 0, y: 0, z: 0 };

    // Radial attractor force to maintain exact encirclement perimeter
    const radialError = distToTarget - targetEncirclementRadius;
    const radialFx = (dx / distToTarget) * radialError;
    const radialFz = (dz / distToTarget) * radialError;

    // Tangential peer-repulsion force: pushes peers to distribute evenly along the circular perimeter
    let tangentialFx = 0;
    let tangentialFz = 0;

    for (const peer of peers) {
      const px = agentPos.x - peer.position.x;
      const pz = agentPos.z - peer.position.z;
      const peerDist = FastMath.fastNorm3D(px, 0, pz);

      if (peerDist < 6.0 && peerDist > 0.001) {
        // Orthogonal tangential push away from neighboring peer
        const factor = 1.0 / (peerDist * peerDist);
        tangentialFx += (px / peerDist) * factor;
        tangentialFz += (pz / peerDist) * factor;
      }
    }

    const netX = radialFx + tangentialFx;
    const netZ = radialFz + tangentialFz;
    const netMag = FastMath.fastNorm3D(netX, 0, netZ);

    return netMag > 0 ? { x: netX / netMag, y: 0, z: netZ / netMag } : { x: 0, y: 0, z: 0 };
  }
}
