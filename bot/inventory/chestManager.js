'use strict';

/**
 * Container indexing and automated inventory consolidation.
 */
class ChestManager {
  static CATEGORIES = {
    WEAPONS: ['sword', 'bow', 'crossbow', 'trident', 'axe'],
    ARMOR: ['helmet', 'chestplate', 'leggings', 'boots', 'shield'],
    CONSUMABLES: ['cooked_beef', 'golden_apple', 'enchanted_golden_apple', 'potion', 'bread'],
    VALUABLES: ['diamond', 'emerald', 'iron_ingot', 'gold_ingot', 'netherite_ingot', 'totem_of_undying'],
    DROPS: ['rotten_flesh', 'bone', 'string', 'gunpowder', 'spider_eye', 'ender_pearl', 'arrow']
  };

  constructor(bot) {
    this.bot = bot;
    this.knownChests = new Map();
  }

  registerChest(blockPosition, category = 'GENERAL') {
    const key = `${blockPosition.x},${blockPosition.y},${blockPosition.z}`;
    this.knownChests.set(key, { pos: blockPosition, category, lastChecked: 0 });
  }

  getItemCategory(itemName) {
    for (const [cat, items] of Object.entries(ChestManager.CATEGORIES)) {
      if (items.some(kw => itemName.includes(kw))) {
        return cat;
      }
    }
    return 'MISC';
  }

  async depositCategory(chestBlock, targetCategory) {
    const chest = await this.bot.openChest(chestBlock);
    const items = this.bot.inventory.items().filter(item => {
      return targetCategory === 'ALL' || this.getItemCategory(item.name) === targetCategory;
    });

    for (const item of items) {
      try {
        await chest.deposit(item.type, null, item.count);
      } catch (err) {
        console.warn(`[ChestManager] Failed to deposit ${item.name}: ${err.message}`);
      }
    }
    chest.close();
  }
}

module.exports = ChestManager;
