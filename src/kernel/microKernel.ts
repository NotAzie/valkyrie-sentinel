import { ProcessWatchdog } from '../supervisor/watchdog';
import { StructuredLogger } from '../telemetry/logger';
import { MetricsRegistry } from '../telemetry/metrics';

export class ValkyrieMicroKernel {
  public readonly logger = new StructuredLogger('INFO');
  public readonly metrics = new MetricsRegistry();
  public readonly watchdog: ProcessWatchdog;

  constructor() {
    this.watchdog = new ProcessWatchdog(async () => {
      this.logger.info('Kernel', 'Reinitializing subsystem pipeline...');
    });
  }

  public boot(): void {
    this.logger.info('Kernel', 'Valkyrie Sentinel Micro-Kernel initialized successfully.');
    this.metrics.setGauge('kernel_status', 1);
  }
}
