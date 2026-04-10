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

describe("dashboard monthly query", () => {
  it("returns zero totals for an empty month", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const result = await caller.dashboard.monthly({ profileId: profile.id, year: 2026, month: 4 });
    expect(result.totalIncomeCents).toBe(0);
    expect(result.totalExpensesCents).toBe(0);
    expect(result.netBalanceCents).toBe(0);
    expect(result.expensesByPaymentMethod).toEqual([]);
    expect(result.expensesByCategory).toEqual([]);
    expect(result.investmentContributions).toEqual([]);
    sqlite.close();
  });

  it("computes total income and expenses correctly", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });

    await caller.income.create({ profileId: profile.id, year: 2026, month: 4, name: "Salary", amountCents: 500000 });
    await caller.income.create({ profileId: profile.id, year: 2026, month: 4, name: "Bonus", amountCents: 100000 });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Rent", amountCents: 150000, paymentMethod: "debit", categoryId: cats[0].id });

    const result = await caller.dashboard.monthly({ profileId: profile.id, year: 2026, month: 4 });
    expect(result.totalIncomeCents).toBe(600000);
    expect(result.totalExpensesCents).toBe(150000);
    expect(result.netBalanceCents).toBe(450000);
    sqlite.close();
  });

  it("breaks down expenses by payment method", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });

    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Debit buy", amountCents: 10000, paymentMethod: "debit", categoryId: cats[0].id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "PIX buy", amountCents: 5000, paymentMethod: "pix", categoryId: cats[0].id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "PIX buy 2", amountCents: 3000, paymentMethod: "pix", categoryId: cats[0].id });

    const result = await caller.dashboard.monthly({ profileId: profile.id, year: 2026, month: 4 });
    const debit = result.expensesByPaymentMethod.find((r) => r.paymentMethod === "debit");
    const pix = result.expensesByPaymentMethod.find((r) => r.paymentMethod === "pix");
    expect(debit?.totalCents).toBe(10000);
    expect(pix?.totalCents).toBe(8000);
    sqlite.close();
  });

  it("breaks down expenses by category", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;
    const health = cats.find((c) => c.name === "Health")!;

    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Lunch", amountCents: 2000, paymentMethod: "debit", categoryId: food.id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Pharmacy", amountCents: 5000, paymentMethod: "pix", categoryId: health.id });

    const result = await caller.dashboard.monthly({ profileId: profile.id, year: 2026, month: 4 });
    const foodRow = result.expensesByCategory.find((r) => r.categoryId === food.id);
    const healthRow = result.expensesByCategory.find((r) => r.categoryId === health.id);
    expect(foodRow?.totalCents).toBe(2000);
    expect(healthRow?.totalCents).toBe(5000);
    sqlite.close();
  });

  it("includes investment contributions for the month per goal", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Emergency Fund" });
    await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 4, amountCents: 50000 });
    await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 4, amountCents: 25000 });

    const result = await caller.dashboard.monthly({ profileId: profile.id, year: 2026, month: 4 });
    const goalRow = result.investmentContributions.find((r) => r.goalId === goal.id);
    expect(goalRow?.totalCents).toBe(75000);
    sqlite.close();
  });
});
