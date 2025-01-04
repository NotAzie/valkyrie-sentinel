'use strict';

/**
 * EquipmentManager — automatically equips best available gear.
 *
 * Tiers: diamond > iron > golden > stone > wood > leather (armor)
 *        netherite > diamond > iron > stone > wood > gold (weapons)
 */

const WEAPON_PRIORITY = ['netherite', 'diamond', 'iron', 'stone', 'wood', 'gold'];
const ARMOR_PRIORITY  = ['netherite', 'diamond', 'iron', 'golden', 'chainmail', 'leather'];
const ARMOR_SLOTS     = ['helmet', 'chestplate', 'leggings', 'boots'];

class EquipmentManager {
  constructor(bot) {
    this.bot = bot;
  }

  async equipBestWeapon() {
    const sword = this._findBest('sword', WEAPON_PRIORITY)
                  ?? this._findBest('axe',   WEAPON_PRIORITY);
    if (!sword) return;
    try { await this.bot.equip(sword, 'hand'); } catch {}
  }

  async equipBestArmor() {
    for (const slot of ARMOR_SLOTS) {
      const piece = this._findBest(slot, ARMOR_PRIORITY);
      if (!piece) continue;
      // Check current armor slot
      const cur = this.bot.inventory.slots[this._armorSlot(slot)];
      if (cur && this._tierOf(cur.name, ARMOR_PRIORITY) >= this._tierOf(piece.name, ARMOR_PRIORITY)) continue;
      try { await this.bot.equip(piece, slot); } catch {}
    }
  }

  check() {
    this.equipBestWeapon().catch(() => {});
    this.equipBestArmor().catch(() => {});
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  _findBest(type, priority) {
    const items = this.bot.inventory.items().filter(i => i.name.includes(type));
    if (!items.length) return null;

    items.sort((a, b) => {
      const ta = this._tierOf(a.name, priority);
      const tb = this._tierOf(b.name, priority);
      if (tb !== ta) return tb - ta; // higher tier first
      // Prefer items with more durability
      const da = a.durabilityUsed ?? 0;
      const db = b.durabilityUsed ?? 0;
      return da - db;
    });

    // Avoid broken items if alternative exists
    const best = items[0];
    const maxDur = best.maxDurability ?? Infinity;
    const used   = best.durabilityUsed ?? 0;
    if (used / maxDur > 0.9 && items.length > 1) return items[1];

    return best;
  }

  _tierOf(name, priority) {
    const n = name.toLowerCase();
    for (let i = 0; i < priority.length; i++) {
      if (n.includes(priority[i])) return priority.length - i;
    }
    return 0;
  }

  _armorSlot(type) {
    const slots = { helmet: 5, chestplate: 6, leggings: 7, boots: 8 };
    return slots[type] ?? -1;
  }

  // shouldReturn: inventory check (delegated to StoreItems)
  shouldReturn() {
    return (this.bot.inventory?.items()?.length ?? 0) >= 20;
  }
}

module.exports = EquipmentManager;
