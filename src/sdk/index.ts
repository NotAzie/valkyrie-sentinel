import { ISpatialDriver } from '../protocol/driverInterface';
import { Valkyrie } from '../valkyrie';
import { CognitiveKernel } from '../agent/cognitiveKernel';
import { GoalPlanner } from '../agent/goalPlanner';
import { RuntimeProfiler } from '../meta/profiler';
import { AdaptiveSynthesizer } from '../meta/adaptiveSynthesizer';

/**
 * Valkyrie Foundation SDK.
 * The core infrastructure platform for developing enterprise autonomous agents.
 */
export class ValkyrieAgentInstance {
  public readonly cognitive = new CognitiveKernel();
  public readonly planner = new GoalPlanner();
  public readonly profiler = new RuntimeProfiler();
  public readonly synthesizer = new AdaptiveSynthesizer();
  private isRunning = false;

  constructor(public readonly driver: ISpatialDriver) {}

  public async startAutonomousLoop(frequencyHz = 20): Promise<void> {
    this.isRunning = true;
    const intervalMs = Math.floor(1000 / frequencyHz);

    const loop = async () => {
      if (!this.isRunning) return;
      this.profiler.beginTick();

      try {
        const snapshot = await this.driver.captureWorldSnapshot();
        const profile = this.profiler.captureSnapshot(snapshot.entities.length);
        this.synthesizer.evaluateAndAdapt(profile);

        // Core pure resolve
        const world = {
          botPosition: snapshot.agentState.position,
          botVelocity: snapshot.agentState.velocity,
          botHealth: snapshot.agentState.health,
          targetPosition: snapshot.entities[0]?.position || null,
          targetVelocity: snapshot.entities[0]?.velocity || null,
          targetOnGround: false,
          serverPingMs: snapshot.networkLatencyMs,
          hazards: []
        };

        const impulse = Valkyrie.resolve(world);

        await this.driver.applyActionVector({
          movementImpulse: impulse.movementVelocity,
          orientation: impulse.aimAngles,
          primaryAction: impulse.shouldAttack
        });

        await this.planner.evaluateAndAdvance();
      } catch (err: any) {
        console.error(`[ValkyrieSDK] Error in autonomous cycle: ${err.message}`);
      }

      setTimeout(loop, intervalMs);
    };

    loop();
  }

  public stop(): void {
    this.isRunning = false;
  }
}

export function createValkyrieAgent(driver: ISpatialDriver): ValkyrieAgentInstance {
  return new ValkyrieAgentInstance(driver);
}
