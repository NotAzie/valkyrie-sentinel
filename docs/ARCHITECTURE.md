# Valkyrie Sentinel - Architectural Specification

## Subsystem Overview
The Valkyrie Sentinel runtime is partitioned into strictly isolated layers:

1. **Perception Layer:** Ingests raw Minecraft network packets, maintains entity lifecycle records in a 3D Octree, and smooths position/velocity deltas through a 3D Kalman filter.
2. **Kinematic Layer:** Solves trajectory curves (RK4 numerical integration) and computes artificial potential field navigation gradients.
3. **Behavioral Layer:** Priority-driven Hierarchical Finite State Machine (HFSM) evaluating transitions at 20 Hz.
4. **Execution Layer:** Sub-tick packet transactions for W-tapping, critical hits, auto-totem swaps, and directional shield parries.
5. **Observability Layer:** Structured JSONL stream and Prometheus `/metrics` endpoint.
