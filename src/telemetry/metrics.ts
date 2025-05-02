export class MetricsRegistry {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();

  public incCounter(name: string, value = 1): void {
    const curr = this.counters.get(name) || 0;
    this.counters.set(name, curr + value);
  }

  public setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  public toPrometheusFormat(): string {
    const lines: string[] = [];
    for (const [k, v] of this.counters.entries()) {
      lines.push(`# TYPE ${k} counter`);
      lines.push(`${k} ${v}`);
    }
    for (const [k, v] of this.gauges.entries()) {
      lines.push(`# TYPE ${k} gauge`);
      lines.push(`${k} ${v}`);
    }
    return lines.join('\n') + '\n';
  }
}
