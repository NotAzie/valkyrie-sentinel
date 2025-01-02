'use strict';

/**
 * MeleeCombat — mob-aware combat handler.
 *
 * Handles:
 *  - Attack cooldown timing (1.1 s default, weapon-adjusted)
 *  - Strafing & repositioning
 *  - Mob-specific strategies (creeper, skeleton, baby_zombie, etc.)
 *  - Multi-target awareness
 */

const { goals: { GoalFollow, GoalNear } } = require('mineflayer-pathfinder');
const TargetSelector = require('./targetSelector');

// Minecraft 1.9+ weapon recovery periods (ms): Swords = 625ms (1.6s atk speed), Axes = 1000-1250ms (0.8-1.0s)
const DEFAULT_ATTACK_COOLDOWN_MS = 625;
const WEAPON_COOLDOWNS_MS = {
  sword: 625,
  trident: 909,
  shovel: 1000,
  pickaxe: 833,
  axe: 1250,
};  // ~1 gapless hit per second (slightly under 1.1s)
const STRAFE_INTERVAL_MS = 800;
const REPOSITION_CHANCE  = 0.3;

class MeleeCombat {
  constructor(bot, stateManager) {
    this.bot          = bot;
    this.sm           = stateManager;
    this.selector     = new TargetSelector(bot);

    this._lastAttack  = 0;
    this._lastStrafe  = 0;
    this._strafeDir   = 1;
    this._combatTicks = 0;
  }

  // ── State handler interface ───────────────────────────────────────────────

  enter() {
    console.log('[Combat] Entering COMBAT state');
    this._combatTicks = 0;
    this.bot._equipmentManager?.equipBestWeapon();
    this.bot._equipmentManager?.equipBestArmor();
  }

  tick() {
    const target = this.selector.selectTarget();
    if (!target || !target.isValid) {
      this._onTargetLost();
      return;
    }

    const name = target.name?.toLowerCase().replace('minecraft:', '') ?? '';

    // Route to mob-specific combat strategy
    switch (name) {
      case 'creeper':     this._fightCreeper(target);   break;
      case 'skeleton':
      case 'stray':
      case 'bogged':      this._fightSkeleton(target);  break;
      case 'baby_zombie': this._fightBabyZombie(target); break;
      default:            this._fightMelee(target);      break;
    }

    this._combatTicks++;
  }

  // ── Mob-specific strategies ───────────────────────────────────────────────

  /** Standard melee: approach, time cooldown, strafe, attack */
  _fightMelee(target) {
    const dist = this._distTo(target);
    const pf   = this.bot.pathfinder;

    if (dist > 4) {
      // Close the gap
      pf.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 2.5));
    } else {
      pf.stop();
      this._lookAt(target);
      this._maybeStrafe();
      this._tryAttack(target);
    }
  }

  /**
   * Creeper: hit-and-retreat to avoid explosion.
   * Never let creeper fuse complete. Keep range 4–6 blocks.
   */
  _fightCreeper(target) {
    const dist    = this._distTo(target);
    const pf      = this.bot.pathfinder;
    const fusing  = this._isFusing(target);

    if (fusing || dist < 3.5) {
      // Emergency backstep
      this._backstep();
    } else if (dist > 5) {
      // Move in to strike
      pf.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 3.5));
    } else {
      // In strike range — attack then immediately backstep
      pf.stop();
      this._lookAt(target);
      if (this._tryAttack(target)) {
        this._backstep();
      }
    }
  }

  /**
   * Skeleton: use shield when in ranged danger, strafe diagonally, rush to melee.
   */
  _fightSkeleton(target) {
    const dist = this._distTo(target);
    const pf   = this.bot.pathfinder;

    const inRangedDanger = dist > 6;

    if (inRangedDanger) {
      // Shield + diagonal approach
      this._raiseShield();
      const diag = this._diagonalApproach(target);
      pf.setGoal(new GoalNear(diag.x, diag.y, diag.z, 2));
    } else {
      this._lowerShield();
      pf.stop();
      this._lookAt(target);
      this._maybeStrafe();
      this._tryAttack(target);
    }
  }

  /** Baby zombie: very fast, needs fast reaction and close range control */
  _fightBabyZombie(target) {
    const dist = this._distTo(target);
    const pf   = this.bot.pathfinder;

    if (dist > 3) {
      pf.setGoal(new GoalNear(target.position.x, target.position.y, target.position.z, 2));
    } else {
      pf.stop();
      this._lookAt(target);
      this._tryAttack(target);
      // Baby zombies are fast — reposition slightly each hit
      if (this._combatTicks % 3 === 0) this._microStrafe();
    }
  }

  // ── Attack helpers ────────────────────────────────────────────────────────

  _tryAttack(target) {
    const now = Date.now();
    const cd  = this._getAttackCooldown();
    if (now - this._lastAttack < cd) return false;
    if (!target?.isValid) return false;

    this.bot.attack(target);
    this._lastAttack = now;
    return true;
  }

  _getAttackCooldown() {
    // Could inspect held item speed, but 650ms is safe default
    return ATTACK_COOLDOWN_MS;
  }

  // ── Movement helpers ──────────────────────────────────────────────────────

  _maybeStrafe() {
    const now = Date.now();
    if (now - this._lastStrafe < STRAFE_INTERVAL_MS) return;
    this._lastStrafe = now;

    if (Math.random() < REPOSITION_CHANCE) {
      this._strafeDir *= -1;
    }
    this._microStrafe();
  }

  _microStrafe() {
    // Brief strafe via control states
    this.bot.setControlState('left',  this._strafeDir === 1);
    this.bot.setControlState('right', this._strafeDir !== 1);
    setTimeout(() => {
      this.bot.setControlState('left',  false);
      this.bot.setControlState('right', false);
    }, 250);
  }

  _backstep() {
    this.bot.setControlState('back', true);
    setTimeout(() => this.bot.setControlState('back', false), 350);
  }

  _diagonalApproach(target) {
    const botPos = this.bot.entity.position;
    const tPos   = target.position;
    const dx = tPos.x - botPos.x;
    const dz = tPos.z - botPos.z;
    // Offset diagonally
    return {
      x: tPos.x + dz * 0.5,
      y: tPos.y,
      z: tPos.z - dx * 0.5,
    };
  }

  _raiseShield() {
    // Shield = offhand item use
    if (!this.bot._shieldRaised) {
      this.bot.activateItem(true);
      this.bot._shieldRaised = true;
    }
  }

  _lowerShield() {
    if (this.bot._shieldRaised) {
      this.bot.deactivateItem();
      this.bot._shieldRaised = false;
    }
  }

  _isFusing(entity) {
    // Creeper fuse metadata: entity.metadata[16] === true in some versions
    // Fallback: check if entity name includes creeper and is very close
    return entity?.metadata?.[16] === true;
  }

  _lookAt(entity) {
    if (entity?.position) {
      this.bot.lookAt(entity.position.offset(0, entity.height * 0.9, 0));
    }
  }

  _distTo(entity) {
    if (!entity?.position || !this.bot.entity?.position) return 999;
    return this.bot.entity.position.distanceTo(entity.position);
  }

  _onTargetLost() {
    this.selector.clearTarget();
    this._lowerShield();
    this.bot.pathfinder.stop();
    this.sm.forceTransition(
      this.sm.mode === 'protect' ? 'FOLLOW' : 'HUNT'
    );
  }
}

module.exports = MeleeCombat;
