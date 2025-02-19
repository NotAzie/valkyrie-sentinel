'use strict';

/**
 * 2D Parabolic Ballistic Trajectory Predictor.
 * Solves firing pitch and yaw taking gravity and arrow initial velocity into account.
 */
class Ballistics2D {
  static GRAVITY = 0.05; // blocks per tick^2 in Minecraft
  static DRAG = 0.99;

  static solveFiringPitch(distance, deltaY, speed) {
    const v2 = speed * speed;
    const v4 = v2 * v2;
    const g = Ballistics2D.GRAVITY;
    const x = distance;
    const y = deltaY;

    const discriminant = v4 - g * (g * x * x + 2 * y * v2);
    if (discriminant < 0) {
      return Math.PI / 4;
    }

    const root = Math.sqrt(discriminant);
    const angleLow = Math.atan((v2 - root) / (g * x));
    return angleLow;
  }
}

module.exports = Ballistics2D;
