# Minecraft Combat Bot - Autonomous Tactical Client

A modular, intelligent Minecraft survival combat and hunting companion built with **Mineflayer**.

---

## Features

| Capability | Details |
|---|---|
| **Protect Mode** | Follows player, defends against threats, stays 2–4 blocks away |
| **Hunt Mode** | Roams independently, kills mobs, collects drops, returns when full |
| **Stay Mode** | Idles until next command |
| **Mob-Specific Combat** | Creeper hit-and-retreat, skeleton shield + diagonal rush, baby zombie fast response |
| **State Machine** | Priority-driven (ESCAPE → RETREAT → COMBAT → EAT → ...) |
| **Event-Driven Perception** | Uses entity spawn/move/gone events — no heavy tick scans |
| **Auto Equipment** | Equips best sword, armor, shield automatically |
| **Auto Eating** | Eats when hungry or healing |
| **Loot Collection** | Picks up drops after kills before moving on |
| **Inventory Management** | Returns home to store when inventory is 60%+ full |
| **Stuck Recovery** | Jump, repath, obstacle handling |

---

## Installation

```bash
npm install
```

---

## Configuration

Edit environment variables or set them before running:

| Variable | Default | Description |
|---|---|---|
| `MC_HOST` | `localhost` | Server IP |
| `MC_PORT` | `25565` | Server port |
| `MC_USERNAME` | `CombatBot` | Bot username |
| `MC_VERSION` | `1.20.1` | Minecraft version |
| `MC_AUTH` | `offline` | `offline` or `microsoft` |

---

## Running

```bash
node index.js
# or with env vars:
MC_HOST=my.server.com MC_USERNAME=CombatBot node index.js
```

---

## Chat Commands

Type these in Minecraft chat (any player can use them):

| Command | Description |
|---|---|
| `protect` | Follow and defend you |
| `hunt` | Independent hunt mode |
| `stay` | Stop and idle |
| `return` | Go home and store items |
| `sethome` | Set home to bot's current position |
| `setchest` | Set chest to block you're looking at |
| `status` | Report state, health, food, item count |
| `help` | List all commands |

---

## Setup Guide

### 1. Prepare the bot

Give the bot:
- Sword (iron or diamond recommended)
- Shield
- Bow + arrows
- Armor set
- Food (cooked beef, bread, etc.)
- Pickaxe (for stuck handling)

### 2. Set home base

Stand near your base and type:
```
sethome
```

### 3. Set chest

Look directly at a chest and type:
```
setchest
```

### 4. Start a mode

```
protect   ← bot follows and defends you
hunt      ← bot roams and hunts independently
```

---

## Architecture

```
bot/
├── core/
│   ├── stateManager.js     ← Centralised FSM with priority ordering
│   ├── memory.js           ← Session memory (home, chest, danger zones)
│   └── eventManager.js     ← Mineflayer event wiring
│
├── perception/
│   ├── entityTracker.js    ← Event-driven entity map
│   ├── threatAnalysis.js   ← Pressure/overwhelm scoring
│   └── scanner.js          ← Lightweight periodic resync
│
├── combat/
│   ├── targetSelector.js   ← Dynamic priority scoring, no random switching
│   ├── meleeCombat.js      ← Mob-specific strategies, strafing, cooldowns
│   ├── defense.js          ← ESCAPE state — sprint away from threats
│   └── movementCombat.js   ← RETREAT state — back off and heal
│
├── tasks/
│   ├── protect.js          ← FOLLOW state — player escort
│   ├── hunt.js             ← HUNT state — roam and hunt
│   ├── collect.js          ← COLLECT state — pick up drops
│   ├── returnHome.js       ← RETURN_HOME state
│   └── storeItems.js       ← STORE_ITEMS state — chest deposit
│
├── inventory/
│   ├── equipmentManager.js ← Auto-equip best gear
│   ├── foodManager.js      ← EAT state — auto eat
│   └── chestManager.js     ← Inventory fill tracking
│
└── commands/
    └── chatCommands.js     ← All chat command handling
```

---

## State Machine

```
Priority (highest → lowest):

ESCAPE       health ≤ 3 or overwhelmed (4+ hostiles, HP < 8)
RETREAT      health < 5
COMBAT       hostile target detected in range
EAT          food < 8, or food < 16 while HP < 10
STORE_ITEMS  inventory ≥ 20 items
COLLECT      nearby loot items exist
HUNT         hunt mode base state
FOLLOW       protect mode base state
IDLE         stay mode
```

---

## Combat Behaviour Details

### Creeper
Hit-and-retreat pattern. Never shield tanks. Backteps after every hit.

### Skeleton / Stray
Raises shield at range > 6 blocks. Diagonal approach. Closes to melee.

### Baby Zombie
Fast response, no cooldown delay. Micro-strafes each hit.

### General Melee
Attack cooldown-aware (~650ms). Strafes randomly. Repositions occasionally.

### Target Switching
Only switches if new target score exceeds current by **20+ points**. No erratic switching.

---

## Expandability

The following can be added without refactoring existing code:

- **Patrol mode** → new task handler + new state + `setMode('patrol')`
- **Ranged combat** → `rangedCombat.js` module, plug into meleeCombat routing
- **Cave exploration** → new roam strategy in hunt.js
- **Lava/water navigation** → event listeners in eventManager.js
- **Terrain advantage** → extend targetSelector scoring
- **Enemy movement prediction** → extend entityTracker with velocity tracking
- **Persistent memory** → swap Memory class to use file/database backend

---

## Bot Ecosystem Position

| Bot | Role |
|---|---|
| Clearing Bot | Mines resources, clears areas |
| Builder Bot | Takes resources from chest, builds structures |
| **Combat Bot** | Protects player, hunts mobs, collects loot ← *this bot* |
