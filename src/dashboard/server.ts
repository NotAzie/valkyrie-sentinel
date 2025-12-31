import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

export interface TelemetryPayload {
  state: string;
  health: number;
  tickLatencyMs: number;
  activeTargets: number;
  targetLock: string;
}

export class TelemetryDashboardServer {
  private server: http.Server | null = null;
  private currentTelemetry: TelemetryPayload = {
    state: 'STANDBY',
    health: 20.0,
    tickLatencyMs: 0.0,
    activeTargets: 0,
    targetLock: 'NONE'
  };

  constructor(private readonly port = 3000) {}

  public updateTelemetry(payload: Partial<TelemetryPayload>): void {
    this.currentTelemetry = { ...this.currentTelemetry, ...payload };
  }

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const publicDir = path.resolve(__dirname, '../../dashboard/public');

      this.server = http.createServer((req, res) => {
        if (req.url === '/api/telemetry') {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(this.currentTelemetry));
          return;
        }

        let filePath = path.join(publicDir, req.url === '/' ? 'index.html' : req.url || 'index.html');
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
          }
        });
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen(this.port, () => {
        console.log(`[DashboardServer] Tactical telemetry HUD listening on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
