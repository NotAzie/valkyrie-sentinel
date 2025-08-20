import { SwarmAgentMessage, SwarmArbitrationCommand } from './protocol';

export class SwarmMeshCoordinator {
  private peerStates = new Map<string, SwarmAgentMessage>();

  constructor(public readonly localAgentId: string) {}

  public updatePeer(message: SwarmAgentMessage): void {
    if (message.agentId === this.localAgentId) return;
    this.peerStates.set(message.agentId, message);
  }

  public arbitrateTargetPincer(targetEntityId: number): number {
    const peersFocusing = Array.from(this.peerStates.values()).filter(p => p.targetLockId === targetEntityId);
    const agentIndex = peersFocusing.length;
    // Distribute angles evenly around target: 2pi / (peers + 1)
    const angleOffset = (2 * Math.PI / Math.max(1, peersFocusing.length + 1)) * agentIndex;
    return angleOffset;
  }

  public getActivePeers(): SwarmAgentMessage[] {
    const now = Date.now();
    return Array.from(this.peerStates.values()).filter(p => now - p.timestamp < 3000);
  }
}
