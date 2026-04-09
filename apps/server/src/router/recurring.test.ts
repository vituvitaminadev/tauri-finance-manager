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

describe("recurring income router", () => {
  it("list returns empty for a new profile", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const templates = await caller.recurringIncome.list({ profileId: profile.id });
    expect(templates).toHaveLength(0);
    sqlite.close();
  });

  it("can create and list a recurring income template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const template = await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });
    expect(template.name).toBe("Salary");
    expect(template.active).toBe(true);
    const list = await caller.recurringIncome.list({ profileId: profile.id });
    expect(list).toHaveLength(1);
    sqlite.close();
  });

  it("can update a recurring income template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const t = await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });
    const updated = await caller.recurringIncome.update({ id: t.id, name: "Bonus", amountCents: 100000 });
    expect(updated.name).toBe("Bonus");
    sqlite.close();
  });

  it("can deactivate a recurring income template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const t = await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });
    const deactivated = await caller.recurringIncome.deactivate({ id: t.id });
    expect(deactivated.active).toBe(false);
    sqlite.close();
  });

  it("can delete a recurring income template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const t = await caller.recurringIncome.create({ profileId: profile.id, name: "Salary", amountCents: 500000 });
    await caller.recurringIncome.delete({ id: t.id });
    const list = await caller.recurringIncome.list({ profileId: profile.id });
    expect(list).toHaveLength(0);
    sqlite.close();
  });
});

describe("fixed expense router", () => {
  it("list returns empty for a new profile", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const list = await caller.fixedExpense.list({ profileId: profile.id });
    expect(list).toHaveLength(0);
    sqlite.close();
  });

  it("can create and list a fixed expense template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const template = await caller.fixedExpense.create({
      profileId: profile.id,
      name: "Rent",
      amountCents: 150000,
      paymentMethod: "debit",
      categoryId: cats[0].id,
    });
    expect(template.name).toBe("Rent");
    expect(template.active).toBe(true);
    sqlite.close();
  });

  it("can deactivate a fixed expense template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const t = await caller.fixedExpense.create({ profileId: profile.id, name: "Rent", amountCents: 150000, paymentMethod: "debit", categoryId: cats[0].id });
    const deactivated = await caller.fixedExpense.deactivate({ id: t.id });
    expect(deactivated.active).toBe(false);
    sqlite.close();
  });

  it("can delete a fixed expense template", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const t = await caller.fixedExpense.create({ profileId: profile.id, name: "Rent", amountCents: 150000, paymentMethod: "debit", categoryId: cats[0].id });
    await caller.fixedExpense.delete({ id: t.id });
    const list = await caller.fixedExpense.list({ profileId: profile.id });
    expect(list).toHaveLength(0);
    sqlite.close();
  });
});
