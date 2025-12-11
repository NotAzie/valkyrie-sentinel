export interface GoalNode {
  id: string;
  description: string;
  preconditions: string[];
  postconditions: string[];
  execute: () => Promise<boolean>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

/**
 * Autonomous Directed Acyclic Graph (DAG) Goal Planner.
 * Evaluates world states, resolves prerequisite chains, and dynamically executes
 * high-level strategic objectives without human intervention.
 */
export class GoalPlanner {
  private nodes = new Map<string, GoalNode>();
  private completedConditions = new Set<string>();

  public registerNode(node: GoalNode): void {
    this.nodes.set(node.id, node);
  }

  public setConditionMet(condition: string): void {
    this.completedConditions.add(condition);
  }

  public async evaluateAndAdvance(): Promise<string | null> {
    for (const node of this.nodes.values()) {
      if (node.status === 'COMPLETED' || node.status === 'RUNNING') continue;

      const ready = node.preconditions.every(p => this.completedConditions.has(p));
      if (ready) {
        node.status = 'RUNNING';
        console.log(`[GoalPlanner] Executing plan node '${node.id}': ${node.description}`);
        const success = await node.execute();
        if (success) {
          node.status = 'COMPLETED';
          node.postconditions.forEach(p => this.completedConditions.add(p));
          return node.id;
        } else {
          node.status = 'FAILED';
          console.warn(`[GoalPlanner] Plan node '${node.id}' failed execution. Triggering plan replan.`);
        }
      }
    }
    return null;
  }
}
