'use strict';

const { goals: { GoalNear } } = require('mineflayer-pathfinder');

/**
 * Autonomous Perimeter Sentry Patrol.
 */
class PatrolTask {
  constructor(bot, waypoints = []) {
    this.bot = bot;
    this.waypoints = waypoints;
    this.currentIndex = 0;
    this.patrolRadius = 2.0;
  }

  addWaypoint(vec3Pos) {
    this.waypoints.push(vec3Pos);
  }

  tick() {
    if (this.waypoints.length === 0) return;

    const target = this.waypoints[this.currentIndex];
    const dist = this.bot.entity.position.distanceTo(target);

    if (dist <= this.patrolRadius) {
      this.currentIndex = (this.currentIndex + 1) % this.waypoints.length;
    } else {
      this.bot.pathfinder.setGoal(new GoalNear(target.x, target.y, target.z, this.patrolRadius));
    }
  }
}

module.exports = PatrolTask;
