export class PotionCombat {
  constructor(private readonly bot: any) {}

  public async splashFeet(): Promise<boolean> {
    const potion = this.bot.inventory.items().find((i: any) => 
      i.name === 'splash_potion' && (i.nbt?.value?.Potion?.value?.includes('healing') || i.nbt?.value?.Potion?.value?.includes('regeneration'))
    );

    if (!potion) return false;

    await this.bot.equip(potion, 'hand');
    // Look straight down at feet
    await this.bot.look(this.bot.entity.yaw, -Math.PI / 2, true);
    this.bot.activateItem();
    return true;
  }
}
