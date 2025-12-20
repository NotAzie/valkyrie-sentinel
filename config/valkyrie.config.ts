import defaultConfig from './default.json';

export interface ValkyrieConfig {
  system: {
    engine: string;
    protocolVersion: string;
    tickRateHz: number;
    maxTickBudgetMs: number;
  };
  kinematics: {
    reachThreshold: number;
    gravity: number;
    drag: number;
    criticalFallVelocity: number;
  };
  lattice: {
    wordCapacity: number;
    maxDepth: number;
  };
  telemetry: {
    httpPort: number;
    metricsPort: number;
    logLevel: string;
  };
}

export const configuration: ValkyrieConfig = defaultConfig;
