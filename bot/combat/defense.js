'use strict';

/**
 * Defensive posture manager.
 * Intercepts incoming projectile attacks and coordinates shield blocking angles.
 */
class Defense {
  constructor(bot) {
    this.bot = bot;
    this.isBlocking = false;
    this.shieldCooldownUntil = 0;
  }

  raiseShield() {
    const now = Date.now();
    if (now < this.shieldCooldownUntil) return false;

    const offhand = this.bot.inventory.slots[45];
    if (!offhand || offhand.name !== 'shield') {
      const shield = this.bot.inventory.items().find(i => i.name === 'shield');
      if (shield) {
        this.bot.equip(shield, 'off-hand').catch(() => {});
      } else {
        return false;
      }
    }

    if (!this.isBlocking) {
      this.bot.activateItem(true);
      this.isBlocking = true;
    }
    return true;
  }

  lowerShield() {
    if (this.isBlocking) {
      this.bot.deactivateItem();
      this.isBlocking = false;
    }
  }

  isFacingThreat(threatPosition, toleranceRad = 0.785) { // ~45 deg
    const botPos = this.bot.entity.position;
    const dx = threatPosition.x - botPos.x;
    const dz = threatPosition.z - botPos.z;
    const angleToThreat = Math.atan2(-dx, -dz);
    const yawDiff = Math.abs((this.bot.entity.yaw - angleToThreat + Math.PI) % (2 * Math.PI) - Math.PI);
    return yawDiff <= toleranceRad;
  }

  alignToThreat(threatPosition) {
    const eyePos = this.bot.entity.position.offset(0, this.bot.entity.height, 0);
    return this.bot.lookAt(threatPosition);
  }
}

module.exports = Defense;
