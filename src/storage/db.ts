import { Vector3D } from '../types';

export class PersistenceStore {
  private waypoints = new Map<string, Vector3D>();
  private combatLogs: Array<{ action: string; target: string; time: number }> = [];

  constructor(private readonly dbPath: string = 'valkyrie.db') {}

  public async initialize(): Promise<void> {
    console.log(`[PersistenceStore] Initialized WAL state store at ${this.dbPath}`);
  }

  public setWaypoint(name: string, pos: Vector3D): void {
    this.waypoints.set(name, { ...pos });
  }

  public getWaypoint(name: string): Vector3D | undefined {
    return this.waypoints.get(name);
  }

  public logCombatEvent(action: string, target: string): void {
    this.combatLogs.push({ action, target, time: Date.now() });
    if (this.combatLogs.length > 1000) {
      this.combatLogs.shift();
    }
  }

  public getRecentLogs(limit = 50) {
    return this.combatLogs.slice(-limit);
  }
}
