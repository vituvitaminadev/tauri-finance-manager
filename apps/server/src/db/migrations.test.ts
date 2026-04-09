import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "./migrate";

describe("drizzle migrations", () => {
  it("runs without error on a fresh database", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    expect(() => runMigrations(db, sqlite)).not.toThrow();
    sqlite.close();
  });

  it("is idempotent — running twice does not throw", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);
    expect(() => runMigrations(db, sqlite)).not.toThrow();
    sqlite.close();
  });
});
