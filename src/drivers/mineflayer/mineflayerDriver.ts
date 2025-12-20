import { ISpatialDriver, SpatialWorldSnapshot, SpatialEntityState } from '../../protocol/driverInterface';
import { Vector3D } from '../../types';

export interface MineflayerBotInstance {
  entity: {
    position: Vector3D;
    velocity: Vector3D;
    yaw: number;
    pitch: number;
    height: number;
  };
  health: number;
  entities: Record<string, any>;
  blockAt: (pos: Vector3D) => any;
  look: (yaw: number, pitch: number, force: boolean) => Promise<void>;
  attack: (entity: any) => Promise<void>;
  setControlState: (control: string, state: boolean) => void;
  chat: (msg: string) => void;
}

export class MineflayerSpatialDriver implements ISpatialDriver {
  constructor(private readonly bot: MineflayerBotInstance) {}

  public getDriverName(): string {
    return 'Mineflayer-Spatial-Driver';
  }

  public getProtocolVersion(): string {
    return 'VSP/1.0';
  }

  public async captureWorldSnapshot(): Promise<SpatialWorldSnapshot> {
    const botPos = this.bot.entity.position;
    const botVel = this.bot.entity.velocity;

    const entities: SpatialEntityState[] = Object.values(this.bot.entities)
      .filter((e: any) => e && e !== this.bot.entity && e.position)
      .map((e: any) => ({
        id: String(e.id),
        position: { x: e.position.x, y: e.position.y, z: e.position.z },
        velocity: { x: e.velocity?.x || 0, y: e.velocity?.y || 0, z: e.velocity?.z || 0 },
        health: e.health ?? 20.0,
        isHostile: e.type === 'mob' || e.type === 'player',
        boundingBox: { width: e.width || 0.6, height: e.height || 1.8 }
      }));

    return {
      agentState: {
        id: 'valkyrie-primary',
        position: { x: botPos.x, y: botPos.y, z: botPos.z },
        velocity: { x: botVel.x, y: botVel.y, z: botVel.z },
        health: this.bot.health ?? 20.0,
        isHostile: false,
        boundingBox: { width: 0.6, height: this.bot.entity.height || 1.8 }
      },
      entities,
      solidVoxelLookup: (x: number, y: number, z: number) => {
        const b = this.bot.blockAt({ x, y, z });
        return b ? b.boundingBox === 'block' : false;
      },
      networkLatencyMs: 45.0
    };
  }

  public async applyActionVector(action: {
    movementImpulse: Vector3D;
    orientation: { yaw: number; pitch: number };
    primaryAction: boolean;
  }): Promise<void> {
    await this.bot.look(action.orientation.yaw, action.orientation.pitch, true);

    if (Math.hypot(action.movementImpulse.x, action.movementImpulse.z) > 0.1) {
      this.bot.setControlState('forward', true);
      this.bot.setControlState('sprint', true);
    } else {
      this.bot.setControlState('forward', false);
      this.bot.setControlState('sprint', false);
    }

    if (action.primaryAction) {
      const nearest = Object.values(this.bot.entities)[0];
      if (nearest) {
        await this.bot.attack(nearest);
      }
    }
  }

  public async sendChatAlert(message: string): Promise<void> {
    this.bot.chat(`[Valkyrie] ${message}`);
  }
}
