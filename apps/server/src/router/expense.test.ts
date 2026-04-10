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

describe("expense router", () => {
  it("list returns empty for a month with no entries", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const entries = await caller.expense.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(entries).toHaveLength(0);
    sqlite.close();
  });

  it("can create an expense entry with debit payment", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;

    const entry = await caller.expense.create({
      profileId: profile.id,
      year: 2026,
      month: 4,
      name: "Lunch",
      amountCents: 2500,
      paymentMethod: "debit",
      categoryId: food.id,
    });
    expect(entry.name).toBe("Lunch");
    expect(entry.amountCents).toBe(2500);
    expect(entry.paymentMethod).toBe("debit");
    expect(entry.categoryId).toBe(food.id);
    expect(entry.creditCardId).toBeNull();
    sqlite.close();
  });

  it("can create an expense entry with credit card payment", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });
    const cats = await caller.category.list({ profileId: profile.id });

    const entry = await caller.expense.create({
      profileId: profile.id,
      year: 2026,
      month: 4,
      name: "Netflix",
      amountCents: 4490,
      paymentMethod: "credit_card",
      categoryId: cats[0].id,
      creditCardId: card.id,
    });
    expect(entry.paymentMethod).toBe("credit_card");
    expect(entry.creditCardId).toBe(card.id);
    sqlite.close();
  });

  it("list is scoped to the given month and year", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });

    await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "April", amountCents: 100, paymentMethod: "debit", categoryId: cats[0].id });
    await caller.expense.create({ profileId: profile.id, year: 2026, month: 5, name: "May", amountCents: 200, paymentMethod: "debit", categoryId: cats[0].id });

    const april = await caller.expense.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(april).toHaveLength(1);
    expect(april[0].name).toBe("April");
    sqlite.close();
  });

  it("can update an expense entry", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const entry = await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Lunch", amountCents: 2500, paymentMethod: "debit", categoryId: cats[0].id });
    const updated = await caller.expense.update({ id: entry.id, name: "Dinner", amountCents: 5000 });
    expect(updated.name).toBe("Dinner");
    expect(updated.amountCents).toBe(5000);
    sqlite.close();
  });

  it("can delete an expense entry", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const entry = await caller.expense.create({ profileId: profile.id, year: 2026, month: 4, name: "Lunch", amountCents: 2500, paymentMethod: "debit", categoryId: cats[0].id });
    await caller.expense.delete({ id: entry.id });
    const entries = await caller.expense.list({ profileId: profile.id, year: 2026, month: 4 });
    expect(entries).toHaveLength(0);
    sqlite.close();
  });
});
