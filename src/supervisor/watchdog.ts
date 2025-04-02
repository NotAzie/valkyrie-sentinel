import { CircuitBreaker } from './circuitBreaker';
import { WatchdogMetrics } from '../core/types';

export class ProcessWatchdog {
  private reconnectAttempts = 0;
  private readonly baseDelayMs = 1000;
  private readonly maxDelayMs = 30000;
  private lastHeartbeat = Date.now();
  private isShuttingDown = false;
  private readonly breaker = new CircuitBreaker();

  constructor(private readonly onRestartCallback: () => Promise<void>) {}

  public recordHeartbeat(): void {
    this.lastHeartbeat = Date.now();
  }

  public getReconnectDelay(): number {
    const exponent = Math.min(this.reconnectAttempts, 8);
    const unjittered = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, exponent));
    // Full jitter between 0.5x and 1.5x
    const jitterFactor = 0.5 + Math.random();
    return Math.floor(unjittered * jitterFactor);
  }

  public async triggerReconnect(): Promise<void> {
    if (this.isShuttingDown) return;
    this.reconnectAttempts++;
    const delay = this.getReconnectDelay();
    console.log(`[Watchdog] Scheduling reconnection attempt #${this.reconnectAttempts} in ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));
    try {
      await this.breaker.execute(() => this.onRestartCallback());
      this.reconnectAttempts = 0;
      this.recordHeartbeat();
      console.log('[Watchdog] Client successfully re-established.');
    } catch (err: any) {
      console.error(`[Watchdog] Reconnection failed: ${err.message}`);
      await this.triggerReconnect();
    }
  }

  public getMetrics(): WatchdogMetrics {
    return {
      uptimeSeconds: Math.floor(process.uptime()),
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeatTimestamp: this.lastHeartbeat,
      heapUsedBytes: process.memoryUsage().heapUsed,
      tickOverrunCount: 0
    };
  }
}
