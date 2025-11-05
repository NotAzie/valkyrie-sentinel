# Multi-Agent Swarm Arbitration Protocol

## Wire Protocol
Agents exchange 20 Hz synchronization packets over WebSocket or ZeroMQ.

```json
{
  "agentId": "valkyrie-alpha-01",
  "timestamp": 1730000000000,
  "position": { "x": 102.5, "y": 64.0, "z": -204.1 },
  "targetLockId": 482,
  "role": "VANGUARD"
}
```

## Pincer Encirclement Arbitration
When multiple bots acquire identical target IDs, target encirclement angles are deterministically allocated:
$$\theta_k = \frac{2\pi k}{N}$$
Where $N$ is total engaged swarm units and $k \in [0, N-1]$ is the agent assignment index.
