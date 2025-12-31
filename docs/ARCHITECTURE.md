# Valkyrie Sentinel // V1.0 Master Architectural Specification

## Subsystem Pipeline Contracts

The engine evaluates actions on a continuous pipeline:

```
[Spatial Driver] -> [World Snapshot] 
       |
       v
[Memory Arena] -> [Morton Lattice O(1) Mask] 
       |
       v
[Causal Horizon Inversion] <-> [Adversarial Intent Decoder]
       |
       v
[Continuous Geodesic Manifold] -> [Monadic Action Vector]
       |
       v
[Packet Dispatch Alignment] -> [Driver Apply]
```

### Invariants
1. **Constant-Time Invariant:** $\tau_{\text{resolve}} \le 45\,\mu\text{s}$ under all entity counts $\le 200$.
2. **Zero-Allocation Invariant:** No heap allocations during the active execution cycle. All temporary state is stored in the 16 MB static `MemoryArena`.
3. **Decoupled Architecture:** Physical simulation engines must implement `ISpatialDriver` and contain zero engine-specific imports inside `src/`.
