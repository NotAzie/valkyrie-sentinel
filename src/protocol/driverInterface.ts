import { Vector3D } from '../types';

export interface SpatialEntityState {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  health: number;
  isHostile: boolean;
  boundingBox: { width: number; height: number };
}

export interface SpatialWorldSnapshot {
  agentState: SpatialEntityState;
  entities: SpatialEntityState[];
  solidVoxelLookup: (x: number, y: number, z: number) => boolean;
  networkLatencyMs: number;
}

/**
 * Valkyrie Spatial Protocol (VSP/1.0) Driver Interface.
 * Universal abstraction layer allowing Valkyrie to govern ANY simulation,
 * game engine, or spatial robotics platform beyond Minecraft.
 */
export interface ISpatialDriver {
  getDriverName(): string;
  getProtocolVersion(): string;
  captureWorldSnapshot(): Promise<SpatialWorldSnapshot>;
  applyActionVector(action: {
    movementImpulse: Vector3D;
    orientation: { yaw: number; pitch: number };
    primaryAction: boolean;
  }): Promise<void>;
  sendChatAlert(message: string): Promise<void>;
}
