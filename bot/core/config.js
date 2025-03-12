'use strict';

/**
 * Centralized Configuration Schema and Environment Validator.
 */
class Config {
  constructor() {
    this.host = process.env.MC_HOST || 'localhost';
    this.port = parseInt(process.env.MC_PORT, 10) || 25565;
    this.username = process.env.MC_USERNAME || 'ValkyrieSentinel';
    this.version = process.env.MC_VERSION || '1.20.1';
    this.auth = process.env.MC_AUTH || 'offline';
    this.tickRateHz = parseInt(process.env.MC_TICK_RATE, 10) || 20;
    this.maxHealthThreshold = parseFloat(process.env.MC_RETREAT_HP) || 8.0;
  }

  validate() {
    if (this.port <= 0 || this.port > 65535) {
      throw new Error(`Invalid port: ${this.port}`);
    }
    if (!this.username || this.username.length > 16) {
      throw new Error(`Invalid Minecraft username: ${this.username}`);
    }
  }
}

module.exports = new Config();
