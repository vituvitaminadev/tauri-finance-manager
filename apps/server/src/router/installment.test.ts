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

describe("installment router", () => {
  it("creates exactly N expense_entries for N installments", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });
    const cats = await caller.category.list({ profileId: profile.id });

    await caller.installment.create({
      profileId: profile.id,
      name: "Smart TV Samsung",
      totalAmountCents: 120000,
      installments: 12,
      startYear: 2026,
      startMonth: 1,
      creditCardId: card.id,
      categoryId: cats[0].id,
    });

    // Check all 12 months
    const jan = await caller.expense.list({ profileId: profile.id, year: 2026, month: 1 });
    const dec = await caller.expense.list({ profileId: profile.id, year: 2026, month: 12 });
    expect(jan).toHaveLength(1);
    expect(dec).toHaveLength(1);
    expect(jan[0].name).toBe("Smart TV Samsung (1/12)");
    expect(dec[0].name).toBe("Smart TV Samsung (12/12)");
    sqlite.close();
  });

  it("each installment entry has the correct per-installment amount", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });

    await caller.installment.create({
      profileId: profile.id,
      name: "Laptop",
      totalAmountCents: 120000,
      installments: 12,
      startYear: 2026,
      startMonth: 1,
      creditCardId: card.id,
    });

    const jan = await caller.expense.list({ profileId: profile.id, year: 2026, month: 1 });
    expect(jan[0].amountCents).toBe(10000); // 120000 / 12
    sqlite.close();
  });

  it("wraps year when installments span into next year", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });

    await caller.installment.create({
      profileId: profile.id,
      name: "Item",
      totalAmountCents: 60000,
      installments: 6,
      startYear: 2026,
      startMonth: 10,
      creditCardId: card.id,
    });

    const jan2027 = await caller.expense.list({ profileId: profile.id, year: 2027, month: 3 });
    expect(jan2027).toHaveLength(1);
    expect(jan2027[0].name).toBe("Item (6/6)");
    sqlite.close();
  });

  it("editing one installment does not affect others", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });

    await caller.installment.create({
      profileId: profile.id,
      name: "TV",
      totalAmountCents: 30000,
      installments: 3,
      startYear: 2026,
      startMonth: 1,
      creditCardId: card.id,
    });

    const jan = await caller.expense.list({ profileId: profile.id, year: 2026, month: 1 });
    await caller.expense.update({ id: jan[0].id, amountCents: 99999 });

    const feb = await caller.expense.list({ profileId: profile.id, year: 2026, month: 2 });
    expect(feb[0].amountCents).toBe(10000); // unchanged
    sqlite.close();
  });

  it("cancelling from installment N deletes future entries and keeps past ones", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });

    await caller.installment.create({
      profileId: profile.id,
      name: "TV",
      totalAmountCents: 120000,
      installments: 12,
      startYear: 2026,
      startMonth: 1,
      creditCardId: card.id,
    });

    // Cancel from installment 5 onward
    const may = await caller.expense.list({ profileId: profile.id, year: 2026, month: 5 });
    await caller.installment.cancelFrom({ expenseEntryId: may[0].id });

    // Past entries (1-4) preserved
    for (let m = 1; m <= 4; m++) {
      const entries = await caller.expense.list({ profileId: profile.id, year: 2026, month: m });
      expect(entries).toHaveLength(1);
    }
    // Future entries (5-12) deleted
    for (let m = 5; m <= 12; m++) {
      const entries = await caller.expense.list({ profileId: profile.id, year: 2026, month: m });
      expect(entries).toHaveLength(0);
    }
    sqlite.close();
  });
});
