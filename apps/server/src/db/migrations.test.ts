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

  it("creates the profiles table with id, name, and theme columns", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    // Insert a row to verify the table and columns exist
    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'dark')`);
    const row = sqlite.prepare("SELECT * FROM profiles WHERE name = 'Alice'").get() as {
      id: number;
      name: string;
      theme: string;
    };
    expect(row.name).toBe("Alice");
    expect(row.theme).toBe("dark");
    expect(typeof row.id).toBe("number");
    sqlite.close();
  });
});
