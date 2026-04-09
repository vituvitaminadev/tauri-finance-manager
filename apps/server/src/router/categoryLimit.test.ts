import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "../db/migrate";
import { appRouter, createCallerFactory } from "./index";

function makeTestCaller() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  runMigrations(db, sqlite);
  const caller = createCallerFactory(appRouter)({ db });
  return { caller, sqlite };
}

describe("categoryLimit router", () => {
  it("getMonthLimits returns empty when no limits set", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const limits = await caller.categoryLimit.getMonthLimits({ profileId: profile.id, year: 2026, month: 4 });
    expect(limits).toHaveLength(0);
    sqlite.close();
  });

  it("can set a limit for a category in a specific month", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;

    const limit = await caller.categoryLimit.setLimit({
      profileId: profile.id,
      categoryId: food.id,
      year: 2026,
      month: 4,
      limitCents: 50000,
    });
    expect(limit.limitCents).toBe(50000);
    expect(limit.categoryId).toBe(food.id);
    sqlite.close();
  });

  it("setting limit again for same month updates it (upsert)", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;

    await caller.categoryLimit.setLimit({ profileId: profile.id, categoryId: food.id, year: 2026, month: 4, limitCents: 50000 });
    await caller.categoryLimit.setLimit({ profileId: profile.id, categoryId: food.id, year: 2026, month: 4, limitCents: 75000 });

    const limits = await caller.categoryLimit.getMonthLimits({ profileId: profile.id, year: 2026, month: 4 });
    expect(limits).toHaveLength(1);
    expect(limits[0].limitCents).toBe(75000);
    sqlite.close();
  });

  it("limits are scoped to month — changing april does not affect may", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;

    await caller.categoryLimit.setLimit({ profileId: profile.id, categoryId: food.id, year: 2026, month: 4, limitCents: 50000 });
    await caller.categoryLimit.setLimit({ profileId: profile.id, categoryId: food.id, year: 2026, month: 5, limitCents: 60000 });

    const april = await caller.categoryLimit.getMonthLimits({ profileId: profile.id, year: 2026, month: 4 });
    const may = await caller.categoryLimit.getMonthLimits({ profileId: profile.id, year: 2026, month: 5 });
    expect(april[0].limitCents).toBe(50000);
    expect(may[0].limitCents).toBe(60000);
    sqlite.close();
  });

  it("getCategorySpending returns spending per category for the month", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;

    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Lunch", amountCents: 2500, paymentMethod: "debit", categoryId: food.id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Dinner", amountCents: 3000, paymentMethod: "debit", categoryId: food.id });

    const spending = await caller.categoryLimit.getCategorySpending({ profileId: profile.id, year: 2026, month: 4 });
    const foodSpending = spending.find((s) => s.categoryId === food.id);
    expect(foodSpending?.spentCents).toBe(5500);
    sqlite.close();
  });
});
