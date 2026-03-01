import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS prompt_sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES prompt_sessions(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'claude-haiku-4-5',
      temperature REAL NOT NULL DEFAULT 0.7,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed')),
      lifecycle TEXT NOT NULL DEFAULT 'active' CHECK(lifecycle IN ('active','superseded')),
      error_message TEXT,
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS generated_items (
      id TEXT PRIMARY KEY,
      generation_id TEXT NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL REFERENCES prompt_sessions(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','deleted')),
      edited_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_generations_session ON generations(session_id);
    CREATE INDEX IF NOT EXISTS idx_items_generation ON generated_items(generation_id);
    CREATE INDEX IF NOT EXISTS idx_items_session ON generated_items(session_id);
  `);

  // Additive migrations — safe to run repeatedly on existing DBs
  try { sqlite.exec(`ALTER TABLE generations ADD COLUMN model TEXT NOT NULL DEFAULT 'claude-haiku-4-5'`); } catch {}
  try { sqlite.exec(`ALTER TABLE generations ADD COLUMN temperature REAL NOT NULL DEFAULT 0.7`); } catch {}
}
