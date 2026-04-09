import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "../db/migrate";
import { appRouter, createCallerFactory } from "./index";

function makeTestCaller() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  runMigrations(db, sqlite);
  const createCaller = createCallerFactory(appRouter);
  const caller = createCaller({ db });
  return { caller, sqlite };
}

describe("profile router", () => {
  it("list returns empty array when no profiles exist", async () => {
    const { caller, sqlite } = makeTestCaller();
    const result = await caller.profile.list();
    expect(result).toEqual([]);
    sqlite.close();
  });

  it("create returns a new profile with id, name, and theme", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    expect(profile.name).toBe("Alice");
    expect(profile.theme).toBe("light");
    expect(typeof profile.id).toBe("number");
    sqlite.close();
  });

  it("list returns all created profiles", async () => {
    const { caller, sqlite } = makeTestCaller();
    await caller.profile.create({ name: "Alice" });
    await caller.profile.create({ name: "Bob" });
    const result = await caller.profile.list();
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(expect.arrayContaining(["Alice", "Bob"]));
    sqlite.close();
  });

  it("rename updates the profile name", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const updated = await caller.profile.rename({ id: profile.id, name: "Alicia" });
    expect(updated.name).toBe("Alicia");
    sqlite.close();
  });

  it("delete removes the profile", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    await caller.profile.delete({ id: profile.id });
    const result = await caller.profile.list();
    expect(result).toHaveLength(0);
    sqlite.close();
  });

  it("setTheme updates the profile theme", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const updated = await caller.profile.setTheme({ id: profile.id, theme: "dark" });
    expect(updated.theme).toBe("dark");
    sqlite.close();
  });
});
