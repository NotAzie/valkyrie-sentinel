# Kinematics & Ballistic Mathematical Formulations

## Runge-Kutta 4th-Order Numerical Integration
Projectile motion in Minecraft Java Edition is governed by:

$$\frac{d\mathbf{x}}{dt} = \mathbf{v}$$
$$\frac{d\mathbf{v}}{dt} = -g\mathbf{\hat{j}} - D |\mathbf{v}| \mathbf{v}$$

Where:
- $g = 0.05 \text{ blocks/tick}^2$ (gravitational acceleration)
- $D = 0.01$ (aerodynamic drag coefficient)

Numerical evaluation at tick step $h = 1.0$:
$$\mathbf{k}_1 = f(t_n, \mathbf{y}_n)$$
$$\mathbf{k}_2 = f\left(t_n + \frac{h}{2}, \mathbf{y}_n + h\frac{\mathbf{k}_1}{2}\right)$$
$$\mathbf{k}_3 = f\left(t_n + \frac{h}{2}, \mathbf{y}_n + h\frac{\mathbf{k}_2}{2}\right)$$
$$\mathbf{k}_4 = f(t_n + h, \mathbf{y}_n + h\mathbf{k}_3)$$
$$\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)$$
