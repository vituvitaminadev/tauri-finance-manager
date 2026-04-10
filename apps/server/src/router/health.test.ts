import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "../db/migrate";
import { appRouter, createCallerFactory } from "./index";

function makeTestCaller() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite);
  runMigrations(sqlite);
  const createCaller = createCallerFactory(appRouter);
  return createCaller({ db });
}

describe("health router", () => {
  it("ping returns pong", async () => {
    const caller = makeTestCaller();
    const result = await caller.health.ping();
    expect(result).toBe("pong");
  });
});
