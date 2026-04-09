import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "./migrate";
import path from "path";
import os from "os";
import fs from "fs";

function getDbPath(): string {
  const dataDir = path.join(os.homedir(), ".finance-manager");
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "finance.db");
}

const sqlite = new Database(getDbPath());
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);

runMigrations(db, sqlite);
