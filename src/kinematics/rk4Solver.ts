import { Vector3D } from '../types';

export interface TrajectoryState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface Derivative {
  dx: number;
  dy: number;
  dz: number;
  dvx: number;
  dvy: number;
  dvz: number;
}

/**
 * 4th-Order Runge-Kutta Numerical Integrator for Projectile Trajectories.
 * Models quadratic atmospheric drag and gravity:
 * a = -g * j - (c_drag * |v| * v)
 */
export class RK4BallisticsSolver {
  public static readonly GRAVITY = 0.05; // blocks per tick^2 in Minecraft
  public static readonly DRAG = 0.01;    // drag coefficient (1 - 0.99)

  public static evaluate(
    initial: TrajectoryState,
    t: number,
    dt: number,
    d: Derivative
  ): Derivative {
    const state: TrajectoryState = {
      x: initial.x + d.dx * dt,
      y: initial.y + d.dy * dt,
      z: initial.z + d.dz * dt,
      vx: initial.vx + d.dvx * dt,
      vy: initial.vy + d.dvy * dt,
      vz: initial.vz + d.dvz * dt
    };

    const vMag = Math.hypot(state.vx, state.vy, state.vz);
    const dragX = -RK4BallisticsSolver.DRAG * vMag * state.vx;
    const dragY = -RK4BallisticsSolver.DRAG * vMag * state.vy - RK4BallisticsSolver.GRAVITY;
    const dragZ = -RK4BallisticsSolver.DRAG * vMag * state.vz;

    return {
      dx: state.vx,
      dy: state.vy,
      dz: state.vz,
      dvx: dragX,
      dvy: dragY,
      dvz: dragZ
    };
  }

  public static step(state: TrajectoryState, dt: number): TrajectoryState {
    const nullDeriv: Derivative = { dx: 0, dy: 0, dz: 0, dvx: 0, dvy: 0, dvz: 0 };
    const a = this.evaluate(state, 0.0, 0.0, nullDeriv);
    const b = this.evaluate(state, 0.0, dt * 0.5, a);
    const c = this.evaluate(state, 0.0, dt * 0.5, b);
    const d = this.evaluate(state, 0.0, dt, c);

    const dxdt = (1.0 / 6.0) * (a.dx + 2.0 * (b.dx + c.dx) + d.dx);
    const dydt = (1.0 / 6.0) * (a.dy + 2.0 * (b.dy + c.dy) + d.dy);
    const dzdt = (1.0 / 6.0) * (a.dz + 2.0 * (b.dz + c.dz) + d.dz);
    const dvxdt = (1.0 / 6.0) * (a.dvx + 2.0 * (b.dvx + c.dvx) + d.dvx);
    const dvydt = (1.0 / 6.0) * (a.dvy + 2.0 * (b.dvy + c.dvy) + d.dvy);
    const dvzdt = (1.0 / 6.0) * (a.dvz + 2.0 * (b.dvz + c.dvz) + d.dvz);

    return {
      x: state.x + dxdt * dt,
      y: state.y + dydt * dt,
      z: state.z + dzdt * dt,
      vx: state.vx + dvxdt * dt,
      vy: state.vy + dvydt * dt,
      vz: state.vz + dvzdt * dt
    };
  }
}
