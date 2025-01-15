'use strict';

const State = require('./state');

/**
 * Deterministic Hierarchical Finite State Machine (HFSM).
 * Evaluates priority transitions on every 20 Hz tick.
 */
class StateManager {
  static PRIORITIES = {
    ESCAPE: 100,
    RETREAT: 80,
    COMBAT: 60,
    EAT: 50,
    LOOT: 40,
    STORE: 30,
    TASK: 20,
    IDLE: 10
  };

  constructor(bot) {
    this.bot = bot;
    this.states = new Map();
    this.currentState = null;
    this.previousState = null;
    this.tickInterval = null;
    this.tickBudgetMs = 50;
    this.stateLock = false;
  }

  register(state) {
    if (!(state instanceof State)) {
      throw new TypeError('State must inherit from State base class');
    }
    this.states.set(state.name, state);
  }

  start(tickRateHz = 20) {
    const intervalMs = Math.floor(1000 / tickRateHz);
    this.tickInterval = setInterval(() => this.cycle(), intervalMs);
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.currentState) {
      this.currentState.exit();
      this.currentState = null;
    }
  }

  cycle() {
    const startTime = performance.now();
    try {
      this.evaluateTransitions();
      if (this.currentState) {
        this.currentState.tick();
      }
    } catch (err) {
      console.error(`[StateManager] Error during cycle in state '${this.currentState?.name}':`, err);
    }
    const elapsed = performance.now() - startTime;
    if (elapsed > this.tickBudgetMs) {
      console.warn(`[StateManager] Tick over budget: ${elapsed.toFixed(2)}ms > ${this.tickBudgetMs}ms`);
    }
  }

  evaluateTransitions() {
    if (this.stateLock) return;

    let highestCandidate = null;
    for (const state of this.states.values()) {
      if (state.canEnter()) {
        if (!highestCandidate || state.priority > highestCandidate.priority) {
          highestCandidate = state;
        }
      }
    }

    if (!highestCandidate) return;

    if (!this.currentState || highestCandidate.priority > this.currentState.priority) {
      this.transitionTo(highestCandidate.name);
    }
  }

  transitionTo(stateName) {
    const nextState = this.states.get(stateName);
    if (!nextState) {
      throw new Error(`State '${stateName}' is not registered`);
    }

    if (this.currentState?.name === stateName) return;

    if (this.currentState) {
      this.currentState.exit();
      this.previousState = this.currentState;
    }

    this.currentState = nextState;
    this.currentState.enter();
  }

  getStateName() {
    return this.currentState ? this.currentState.name : 'NONE';
  }
}

module.exports = StateManager;
