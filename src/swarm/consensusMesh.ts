export interface ConsensusVote {
  term: number;
  candidateId: string;
}

/**
 * Decentralized Multi-Agent Swarm Consensus Kernel (Valkyrie-Raft).
 * Elects autonomous swarm leaders and coordinates multi-agent battlefield assignments
 * without centralized infrastructure.
 */
export class SwarmConsensusMesh {
  private currentTerm = 0;
  private isLeader = false;
  private leaderId: string | null = null;
  private votesReceived = new Set<string>();

  constructor(public readonly nodeId: string, private readonly clusterPeers: string[]) {}

  public startElection(): void {
    this.currentTerm++;
    this.votesReceived.clear();
    this.votesReceived.add(this.nodeId);
    console.log(`[ConsensusMesh] Node ${this.nodeId} initiated election for Term ${this.currentTerm}`);

    if (this.votesReceived.size > (this.clusterPeers.length + 1) / 2) {
      this.claimLeadership();
    }
  }

  public receiveVote(peerId: string, term: number): void {
    if (term === this.currentTerm) {
      this.votesReceived.add(peerId);
      if (this.votesReceived.size > (this.clusterPeers.length + 1) / 2) {
        this.claimLeadership();
      }
    }
  }

  private claimLeadership(): void {
    this.isLeader = true;
    this.leaderId = this.nodeId;
    console.log(`[ConsensusMesh] Node ${this.nodeId} ELECTED CLUSTER LEADER for Term ${this.currentTerm}`);
  }

  public getLeadershipState() {
    return { isLeader: this.isLeader, leaderId: this.leaderId, term: this.currentTerm };
  }
}
