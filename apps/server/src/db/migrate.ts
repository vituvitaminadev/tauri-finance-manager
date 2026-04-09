import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { Database } from "better-sqlite3";

/**
 * Runs all pending Drizzle migrations against the given SQLite database.
 * Uses manual SQL execution since no tables exist yet in the scaffold phase.
 * Future issues will use drizzle-kit generated migration files.
 */
export function runMigrations(
  _db: BetterSQLite3Database,
  sqlite: Database
): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT 'light'
    )
  `);
}
