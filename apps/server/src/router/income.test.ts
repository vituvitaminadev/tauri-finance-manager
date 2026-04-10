import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "../db/migrate";
import { appRouter, createCallerFactory } from "./index";

function makeTestCaller() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  runMigrations(sqlite);
  const caller = createCallerFactory(appRouter)({ db });
  return { caller, sqlite };
}

describe("income router", () => {
  it("list returns empty for a month with no entries", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const entries = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(entries).toHaveLength(0);
    sqlite.close();
  });

  it("can create an income entry and list it", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const entry = await caller.income.create({
      profileId: profile.id,
      year: 2026,
      month: 4,
      name: "Salary",
      amountCents: 500000,
    });
    expect(entry.name).toBe("Salary");
    expect(entry.amountCents).toBe(500000);

    const entries = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(entries).toHaveLength(1);
    sqlite.close();
  });

  it("list is scoped to the given month and year", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    await caller.income.create({ profileId: profile.id, year: 2026, month: 4, name: "April Income", amountCents: 100 });
    await caller.income.create({ profileId: profile.id, year: 2026, month: 5, name: "May Income", amountCents: 200 });

    const april = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(april).toHaveLength(1);
    expect(april[0].name).toBe("April Income");
    sqlite.close();
  });

  it("can update an income entry", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const entry = await caller.income.create({ profileId: profile.id, year: 2026, month: 4, name: "Salary", amountCents: 500000 });
    const updated = await caller.income.update({ id: entry.id, name: "Bonus", amountCents: 100000 });
    expect(updated.name).toBe("Bonus");
    expect(updated.amountCents).toBe(100000);
    sqlite.close();
  });

  it("can delete an income entry", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const entry = await caller.income.create({ profileId: profile.id, year: 2026, month: 4, name: "Salary", amountCents: 500000 });
    await caller.income.delete({ id: entry.id });
    const entries = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(entries).toHaveLength(0);
    sqlite.close();
  });
});
