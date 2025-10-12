export class AdaptiveTacticsEvaluator {
  private combatAggressiveness = 0.5; // [0.0 = full evasive, 1.0 = relentless offense]

  public recordCombatOutcome(damageDealt: number, damageReceived: number): void {
    const tradeEfficiency = damageDealt / Math.max(1.0, damageReceived);
    if (tradeEfficiency > 1.5) {
      // Favorable trade: increase aggressiveness
      this.combatAggressiveness = Math.min(1.0, this.combatAggressiveness + 0.05);
    } else if (tradeEfficiency < 0.8) {
      // Unfavorable trade: bias toward defense and distance spacing
      this.combatAggressiveness = Math.max(0.1, this.combatAggressiveness - 0.05);
    }
  }

  public getAggressiveness(): number {
    return this.combatAggressiveness;
  }
}
