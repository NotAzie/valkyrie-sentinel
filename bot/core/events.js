'use strict';

/**
 * High-Throughput Strongly Typed Event Bus.
 */
class EventBus {
  constructor() {
    this.subscribers = new Map();
  }

  subscribe(eventType, handler, priority = 0) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    const list = this.subscribers.get(eventType);
    list.push({ handler, priority });
    list.sort((a, b) => b.priority - a.priority);
  }

  emit(eventType, payload) {
    const list = this.subscribers.get(eventType);
    if (!list) return;

    for (const sub of list) {
      try {
        sub.handler(payload);
      } catch (err) {
        console.error(`[EventBus] Handler exception in '${eventType}':`, err);
      }
    }
  }
}

module.exports = EventBus;
