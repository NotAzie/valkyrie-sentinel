'use strict';

/**
 * StateManager — centralised finite-state machine.
 *
 * Priority order (highest → lowest):
 *   ESCAPE → RETREAT → COMBAT → EAT → STORE_ITEMS → COLLECT → HUNT → FOLLOW → IDLE
 */

const STATES = {
  IDLE:        'IDLE',
  FOLLOW:      'FOLLOW',
  HUNT:        'HUNT',
  COMBAT:      'COMBAT',
  COLLECT:     'COLLECT',
  RETURN_HOME: 'RETURN_HOME',
  STORE_ITEMS: 'STORE_ITEMS',
  RETREAT:     'RETREAT',
  ESCAPE:      'ESCAPE',
  EAT:         'EAT',
  STUCK:       'STUCK',
  SLEEP:       'SLEEP',
};

const STATE_PRIORITY = {
  [STATES.ESCAPE]:      100,
  [STATES.RETREAT]:      90,
  [STATES.COMBAT]:       80,
  [STATES.EAT]:          70,
  [STATES.STORE_ITEMS]:  60,
  [STATES.COLLECT]:      50,
  [STATES.HUNT]:         40,
  [STATES.FOLLOW]:       30,
  [STATES.RETURN_HOME]:  20,
  [STATES.IDLE]:          0,
};

// Interval timings (ms)
const TICK_COMBAT   =  50;
const TICK_DECISION = 300;
const TICK_INVENTORY = 1000;
const TICK_MEMORY   = 5000;

class StateManager {
  constructor(bot) {
    this.bot        = bot;
    this.state      = STATES.IDLE;
    this.mode       = 'idle';   // User-commanded mode: protect | hunt | idle
    this.prevState  = null;
    this._intervals = [];
    this._handlers  = {};
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  start() {
    this._loadHandlers();

    this._intervals.push(
      setInterval(() => this._combatTick(),    TICK_COMBAT),
      setInterval(() => this._decisionTick(),  TICK_DECISION),
      setInterval(() => this._inventoryTick(), TICK_INVENTORY),
      setInterval(() => this._memoryTick(),    TICK_MEMORY),
    );
  }

  stop() {
    this._intervals.forEach(clearInterval);
    this._intervals = [];
  }

  // ── State transitions ─────────────────────────────────────────────────────

  /**
   * Request a state change. Only accepted if the new state has >= priority
   * than the current state, or if forced.
   */
  transition(newState, force = false) {
    if (!STATES[newState]) return;
    const newPriority = STATE_PRIORITY[newState] ?? 0;
    const curPriority = STATE_PRIORITY[this.state] ?? 0;

    if (!force && newPriority < curPriority) return;
    if (this.state === newState) return;

    console.log(`[State] ${this.state} → ${newState}`);
    this.prevState = this.state;
    this.state     = newState;

    this._onEnter(newState);
  }

  forceTransition(newState) {
    this.transition(newState, true);
  }

  // ── Mode commands ─────────────────────────────────────────────────────────

  setMode(mode) {
    console.log(`[Mode] Setting mode: ${mode}`);
    this.mode = mode;

    switch (mode) {
      case 'protect':
        this.forceTransition(STATES.FOLLOW);
        break;
      case 'hunt':
        this.forceTransition(STATES.HUNT);
        break;
      case 'idle':
      case 'stay':
        this.forceTransition(STATES.IDLE);
        break;
      case 'return':
        this.forceTransition(STATES.RETURN_HOME);
        break;
    }
  }

  // ── Tick handlers ─────────────────────────────────────────────────────────

  _combatTick() {
    if (this.state === STATES.COMBAT) {
      const handler = this._handlers[STATES.COMBAT];
      if (handler && handler.tick) handler.tick();
    }
  }

  _decisionTick() {
    this._evaluatePriorities();

    const handler = this._handlers[this.state];
    if (handler && handler.tick) handler.tick();
  }

  _inventoryTick() {
    const invMgr = this.bot._inventoryManager;
    if (invMgr) invMgr.check();
  }

  _memoryTick() {
    this.bot.entityTracker?.cleanup();
  }

  // ── Priority evaluation ───────────────────────────────────────────────────

  _evaluatePriorities() {
    const bot    = this.bot;
    const health = bot.health ?? 20;
    const food   = bot.food   ?? 20;
    const et     = bot.entityTracker;

    // --- Emergency escape
    const nearbyHostile = et?.getHostileCount() ?? 0;
    if (health <= 3 || (nearbyHostile >= 4 && health < 8)) {
      return this.transition(STATES.ESCAPE);
    }

    // --- Retreat
    if (health < 5 && this.state !== STATES.ESCAPE) {
      return this.transition(STATES.RETREAT);
    }

    // --- Active combat threat
    const target = et?.getHighestPriorityTarget();
    if (target) {
      if (this.mode === 'protect' || this.mode === 'hunt') {
        return this.transition(STATES.COMBAT);
      }
    }

    // --- Eat
    if (food < 8 || (health < 10 && food < 16)) {
      return this.transition(STATES.EAT);
    }

    // --- Store items
    const invMgr = bot._inventoryManager;
    if (invMgr?.shouldReturn()) {
      return this.transition(STATES.RETURN_HOME);
    }

    // --- Collect nearby loot
    if (et?.hasNearbyLoot()) {
      if (this.state === STATES.COMBAT) return; // finish combat first
      return this.transition(STATES.COLLECT);
    }

    // --- Mode-driven base states
    if (this.state !== STATES.ESCAPE &&
        this.state !== STATES.RETREAT &&
        this.state !== STATES.STORE_ITEMS &&
        this.state !== STATES.RETURN_HOME) {

      if (this.mode === 'protect') this.transition(STATES.FOLLOW);
      else if (this.mode === 'hunt') this.transition(STATES.HUNT);
      else this.transition(STATES.IDLE);
    }
  }

  // ── State entry hooks ────────────────────────────────────────────────────

  _onEnter(state) {
    const handler = this._handlers[state];
    if (handler && handler.enter) handler.enter();
  }

  // ── Handler registration ─────────────────────────────────────────────────

  _loadHandlers() {
    // Lazy-require to avoid circular deps at module load time
    const CombatHandler     = require('../combat/meleeCombat');
    const FollowHandler     = require('../tasks/protect');
    const HuntHandler       = require('../tasks/hunt');
    const CollectHandler    = require('../tasks/collect');
    const ReturnHomeHandler = require('../tasks/returnHome');
    const StoreHandler      = require('../tasks/storeItems');
    const EatHandler        = require('../inventory/foodManager');
    const EscapeHandler     = require('../combat/defense');
    const RetreatHandler    = require('../combat/movementCombat');
    const EquipHandler      = require('../inventory/equipmentManager');
    const ChestManager      = require('../inventory/chestManager');
    const InventoryManager  = require('../inventory/equipmentManager');

    // Attach shared managers
    this.bot._equipmentManager  = new EquipHandler(this.bot);
    this.bot._chestManager      = new ChestManager(this.bot);
    this.bot._inventoryManager  = new (require('../inventory/chestManager'))(this.bot);

    this._handlers = {
      [STATES.COMBAT]:      new CombatHandler(this.bot, this),
      [STATES.FOLLOW]:      new FollowHandler(this.bot, this),
      [STATES.HUNT]:        new HuntHandler(this.bot, this),
      [STATES.COLLECT]:     new CollectHandler(this.bot, this),
      [STATES.RETURN_HOME]: new ReturnHomeHandler(this.bot, this),
      [STATES.STORE_ITEMS]: new StoreHandler(this.bot, this),
      [STATES.EAT]:         new EatHandler(this.bot, this),
      [STATES.ESCAPE]:      new EscapeHandler(this.bot, this),
      [STATES.RETREAT]:     new RetreatHandler(this.bot, this),
    };
  }
}

module.exports = StateManager;
module.exports.STATES = STATES;
