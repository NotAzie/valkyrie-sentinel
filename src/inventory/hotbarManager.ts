export class HotbarManager {
  public static SLOTS = {
    SWORD: 0,
    BOW: 1,
    GAPPLES: 2,
    PEARLS: 3,
    PICKAXE: 4,
    FOOD: 5,
    BLOCKS: 6,
    OFFHAND: 45
  };

  constructor(private readonly bot: any) {}

  public async configureStandardHotbar(): Promise<void> {
    const items = this.bot.inventory.items();
    const sword = items.find((i: any) => i.name.endsWith('_sword'));
    if (sword && sword.slot !== 36 + HotbarManager.SLOTS.SWORD) {
      // Hotbar slots are indexed 36-44 in Mineflayer
      await this.bot.moveSlotItem(sword.slot, 36 + HotbarManager.SLOTS.SWORD);
    }
  }
}
