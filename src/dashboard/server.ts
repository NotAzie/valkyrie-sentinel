export class TelemetryDashboardServer {
  constructor(private readonly port = 3000) {}

  public start(): void {
    console.log(`[DashboardServer] Fastify telemetry stream listening on http://localhost:${this.port}`);
  }
}
