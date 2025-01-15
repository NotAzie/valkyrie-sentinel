'use strict';

/**
 * Base State definition for the Hierarchical Finite State Machine (HFSM).
 * Enforces lifecycle contracts and priority pre-emption rules.
 */
class State {
  constructor(name, priority, stateManager) {
    this.name = name;
    this.priority = priority; // Higher integer = higher execution precedence
    this.sm = stateManager;
    this.bot = stateManager.bot;
    this.activeTicks = 0;
  }

  canEnter() {
    return true;
  }

  enter() {
    this.activeTicks = 0;
  }

  tick() {
    this.activeTicks++;
  }

  exit() {
    this.activeTicks = 0;
  }

  canInterrupt(targetState) {
    return this.priority > targetState.priority;
  }
}

module.exports = State;
