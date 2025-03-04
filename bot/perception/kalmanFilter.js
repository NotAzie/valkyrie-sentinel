'use strict';

/**
 * 1D Kalman Filter for linear velocity and position smoothing.
 */
class KalmanFilter1D {
  constructor(processNoise = 1e-3, measurementNoise = 1e-1, estimatedError = 1.0) {
    this.q = processNoise;
    this.r = measurementNoise;
    this.p = estimatedError;
    this.x = 0;
    this.k = 0;
  }

  update(measurement) {
    this.p = this.p + this.q;
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;
    return this.x;
  }
}

module.exports = KalmanFilter1D;
