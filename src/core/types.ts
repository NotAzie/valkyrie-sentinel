import { Vector3D } from '../types';

export interface StateLifecycle {
  name: string;
  priority: number;
  canEnter(): boolean;
  enter(): void;
  tick(): void;
  exit(): void;
}

export interface WatchdogMetrics {
  uptimeSeconds: number;
  reconnectAttempts: number;
  lastHeartbeatTimestamp: number;
  heapUsedBytes: number;
  tickOverrunCount: number;
}
