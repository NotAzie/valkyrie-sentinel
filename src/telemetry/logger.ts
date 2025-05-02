export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class StructuredLogger {
  private readonly levels: Record<LogLevel, number> = {
    TRACE: 10,
    DEBUG: 20,
    INFO: 30,
    WARN: 40,
    ERROR: 50
  };

  constructor(private readonly minLevel: LogLevel = 'INFO') {}

  public log(level: LogLevel, context: string, message: string, data?: Record<string, any>): void {
    if (this.levels[level] < this.levels[this.minLevel]) return;

    const payload = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...(data ? { meta: data } : {})
    };

    const out = JSON.stringify(payload);
    if (level === 'ERROR' || level === 'WARN') {
      process.stderr.write(out + '\n');
    } else {
      process.stdout.write(out + '\n');
    }
  }

  public info(context: string, message: string, data?: Record<string, any>) {
    this.log('INFO', context, message, data);
  }

  public warn(context: string, message: string, data?: Record<string, any>) {
    this.log('WARN', context, message, data);
  }

  public error(context: string, message: string, data?: Record<string, any>) {
    this.log('ERROR', context, message, data);
  }
}
