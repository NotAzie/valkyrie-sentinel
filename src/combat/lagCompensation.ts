import { Vector3D } from '../types';

export class LagCompensator {
  private pingHistory: number[] = [];

  public recordPing(rttMs: number): void {
    this.pingHistory.push(rttMs);
    if (this.pingHistory.length > 20) {
      this.pingHistory.shift();
    }
  }

  public getAveragePing(): number {
    if (this.pingHistory.length === 0) return 50.0;
    const sum = this.pingHistory.reduce((a, b) => a + b, 0);
    return sum / this.pingHistory.length;
  }

  public extrapolateTargetPosition(currentPos: Vector3D, velocity: Vector3D): Vector3D {
    const pingMs = this.getAveragePing();
    const serverTickOffset = (pingMs / 2.0) / 50.0; // Server tick offset

    return {
      x: currentPos.x + velocity.x * serverTickOffset,
      y: currentPos.y + velocity.y * serverTickOffset,
      z: currentPos.z + velocity.z * serverTickOffset
    };
  }

  public isWithinReach(botEyePos: Vector3D, targetExtrapolatedPos: Vector3D, maxReach = 3.0): boolean {
    const distSq = (
      (botEyePos.x - targetExtrapolatedPos.x) ** 2 +
      (botEyePos.y - targetExtrapolatedPos.y) ** 2 +
      (botEyePos.z - targetExtrapolatedPos.z) ** 2
    );
    return distSq <= maxReach * maxReach;
  }
}
