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

describe("annualOverview.yearly", () => {
  it("yearly totals equal the sum of all 12 monthly totals", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });

    // Add income and expenses in different months
    await caller.income.create({ profileId: profile.id, year: 2026, month: 1, name: "Jan Salary", amountCents: 500000 });
    await caller.income.create({ profileId: profile.id, year: 2026, month: 3, name: "Mar Salary", amountCents: 500000 });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 1, name: "Rent", amountCents: 150000, paymentMethod: "debit", categoryId: cats[0].id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 2, name: "Food", amountCents: 30000, paymentMethod: "pix", categoryId: cats[0].id });

    const result = await caller.annualOverview.yearly({ profileId: profile.id, year: 2026 });
    expect(result.totalIncomeCents).toBe(1000000);
    expect(result.totalExpensesCents).toBe(180000);
    expect(result.netBalanceCents).toBe(820000);
    sqlite.close();
  });

  it("months table has 12 entries, months with no data show zero", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });

    const result = await caller.annualOverview.yearly({ profileId: profile.id, year: 2026 });
    expect(result.months).toHaveLength(12);
    expect(result.months.every((m) => m.incomeCents === 0 || m.incomeCents > 0)).toBe(true);
    expect(result.months[0].month).toBe(1);
    expect(result.months[11].month).toBe(12);
    sqlite.close();
  });

  it("identifies the month with highest and lowest expenses", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });

    await caller.expense.create({ profileId: profile.id, year: 2026, month: 1, name: "Big", amountCents: 500000, paymentMethod: "debit", categoryId: cats[0].id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 6, name: "Small", amountCents: 5000, paymentMethod: "pix", categoryId: cats[0].id });

    const result = await caller.annualOverview.yearly({ profileId: profile.id, year: 2026 });
    expect(result.highestExpenseMonth).toBe(1);
    expect(result.lowestExpenseMonth).toBe(6);
    sqlite.close();
  });

  it("identifies the category with the highest total spending", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;
    const health = cats.find((c) => c.name === "Health")!;

    await caller.expense.create({ profileId: profile.id, year: 2026, month: 1, name: "Food1", amountCents: 50000, paymentMethod: "debit", categoryId: food.id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 2, name: "Food2", amountCents: 40000, paymentMethod: "debit", categoryId: food.id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 1, name: "Health1", amountCents: 30000, paymentMethod: "pix", categoryId: health.id });

    const result = await caller.annualOverview.yearly({ profileId: profile.id, year: 2026 });
    expect(result.topCategoryId).toBe(food.id);
    sqlite.close();
  });
});
