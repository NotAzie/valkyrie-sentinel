import { Vector3D } from '../types';

export interface SwarmAgentMessage {
  agentId: string;
  timestamp: number;
  position: Vector3D;
  targetLockId: number | null;
  role: 'VANGUARD' | 'FLANKER' | 'SNIPER' | 'RECON';
}

export interface SwarmArbitrationCommand {
  type: 'FOCUS_FIRE' | 'PINCER_ENGAGE' | 'DISPERSE' | 'DEFENSIVE_CIRCLE';
  targetEntityId: number;
  focusAngleRad: number;
}
