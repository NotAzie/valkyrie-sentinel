# Theoretical Foundations: Causal Horizon Inversion & Geodesic Manifolds

## Abstract
In competitive real-time network simulations operating on client-server authoritative architectures, traditional heuristic controllers suffer from perceptual latency bounds governed by the Nyquist tick rate and round-trip transmission latency. Valkyrie Sentinel introduces **Causal Horizon Inversion (CHI)**—a phase-space predictive framework that maps discrete input constraints directly into deterministic reachable manifold cones, coupled with a continuous Eikonal geodesic navigation field.

---

## 1. Mathematical Formulation of the Causal Horizon
Consider an authoritative server with tick step $\Delta t = 50\text{ ms}$.
An entity state vector $\mathbf{x} = [\mathbf{p}, \mathbf{v}]^T \in \mathbb{R}^6$ evolves according to:

$$\mathbf{p}_{t+1} = \mathbf{p}_t + \mathbf{v}_t$$
$$\mathbf{v}_{t+1} = (\mathbf{v}_t \odot \boldsymbol{\gamma} + \mathbf{a}_u) \odot \boldsymbol{\mu}$$

Where:
- $\boldsymbol{\gamma}$ is the medium damping coefficient ($0.91$ in air, $0.546$ on block contact).
- $\boldsymbol{\mu}$ is block slipperiness.
- $\mathbf{a}_u \in \mathcal{U}_{\text{discrete}}$ is the discrete player input space.

When an entity is airborne ($\mathbf{v}_y > 0$), the discrete input space $\mathcal{U}_{\text{discrete}}$ cannot alter vertical gravity dynamics ($g = 0.08\text{ b/t}^2$). Consequently, the state trajectory collapses into a deterministic 1D ballistic arc. CHI projects the exact spatial coordinate $\mathbf{p}^*$ where the entity reaches the critical distance boundary:

$$\|\mathbf{p}^* - \mathbf{p}_{\text{bot}}\| = r_{\text{reach}} = 3.0000\text{ blocks}$$

---

## 2. Fast Marching Eikonal Geodesic Navigation
Instead of graph-based path search algorithms which exhibit worst-case $O(V \log V)$ complexity, Valkyrie computes velocity vectors by directly evaluating the gradient of the continuous arrival-time surface:

$$\|\nabla T(\mathbf{x})\| = \frac{1}{F(\mathbf{x})}$$

Where $F(\mathbf{x})$ incorporates potential repulsion fields from obstacles and environmental hazards:

$$F(\mathbf{x}) = F_0 \prod_{k=1}^K \left(1 - e^{-\frac{\|\mathbf{x} - \mathbf{c}_k\|^2}{2\sigma_k^2}}\right)$$

The optimal continuous velocity is given analytically by:
$$\mathbf{v}^*(\mathbf{x}) = -F(\mathbf{x}) \frac{\nabla T(\mathbf{x})}{\|\nabla T(\mathbf{x})\|}$$

Evaluating this field requires exactly $O(1)$ constant time per decision cycle.
