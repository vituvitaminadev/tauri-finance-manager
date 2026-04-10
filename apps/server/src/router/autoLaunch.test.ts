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

describe("auto-launch service", () => {
  it("initializing a month creates income entries from active recurring templates", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });
    await caller.recurringIncome.create({ profileId: profile.id, name: "Freelance", amountCents: 100000 });

    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });

    const income = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(income).toHaveLength(2);
    expect(income.map((e) => e.name)).toEqual(expect.arrayContaining(["Salary", "Freelance"]));
    sqlite.close();
  });

  it("initializing a month creates expense entries from active fixed expense templates", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    await caller.fixedExpense.create({ profileId: profile.id, name: "Rent", amountCents: 150000, paymentMethod: "debit", categoryId: cats[0].id });

    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });

    const expenses = await caller.expense.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(expenses).toHaveLength(1);
    expect(expenses[0].name).toBe("Rent");
    expect(expenses[0].amountCents).toBe(150000);
    sqlite.close();
  });

  it("initializing the same month twice creates no duplicates (idempotent)", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });

    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });
    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });

    const income = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(income).toHaveLength(1);
    sqlite.close();
  });

  it("deactivated templates are not launched", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const t = await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });
    await caller.recurringIncome.deactivate({ id: t.id });

    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });

    const income = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(income).toHaveLength(0);
    sqlite.close();
  });

  it("editing a launched entry does not affect template or other months", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });

    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });
    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 5 });

    const aprilIncome = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    await caller.income.update({ id: aprilIncome[0].id, amountCents: 999999 });

    const templates = await caller.recurringIncome.list({ profileId: profile.id });
    expect(templates[0].amountCents).toBe(500000); // template unchanged

    const mayIncome = await caller.income.list({ profileId: profile.id, year: 2026, month: 5 });
    expect(mayIncome[0].amountCents).toBe(500000); // may unchanged
    sqlite.close();
  });

  it("auto-launched income entries have recurringIncomeId set", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const t = await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });

    await caller.autoLaunch.initMonth({ profileId: profile.id, year: 2026, month: 4 });

    const income = await caller.income.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(income[0].recurringIncomeId).toBe(t.id);
    sqlite.close();
  });
});
