import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
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
sqlite.exec("PRAGMA journal_mode = WAL");
sqlite.exec("PRAGMA foreign_keys = ON");

export const db = drizzle(sqlite);

runMigrations(sqlite);
