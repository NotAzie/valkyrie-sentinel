export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'LETHAL';

export interface CombatTarget {
  id: number;
  uuid: string;
  name: string;
  type: 'player' | 'mob' | 'projectile';
  position: Vector3D;
  velocity: Vector3D;
  health: number;
  armorScore: number;
  distance: number;
  threatLevel: ThreatLevel;
  lastObservedTick: number;
}

export interface HotbarConfig {
  weaponSlot: number;
  rangedSlot: number;
  healingSlot: number;
  utilitySlot: number;
  offhandItem: string;
}
