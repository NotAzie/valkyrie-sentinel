-- Valkyrie Sentinel State Ledger Schema
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS waypoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  z REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS threat_ledger (
  entity_id INTEGER PRIMARY KEY,
  uuid TEXT,
  name TEXT NOT NULL,
  last_x REAL NOT NULL,
  last_y REAL NOT NULL,
  last_z REAL NOT NULL,
  threat_score REAL NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS combat_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_name TEXT NOT NULL,
  action TEXT NOT NULL,
  damage_dealt REAL,
  damage_received REAL,
  timestamp INTEGER NOT NULL
);
