import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "../db/migrate";
import { appRouter, createCallerFactory } from "./index";

const PREDEFINED_CATEGORIES = [
  "Food", "Health", "Leisure", "Transport", "Housing",
  "Education", "Entertainment", "Clothing", "Subscriptions", "Other",
];

function makeTestCaller() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);
  runMigrations(db, sqlite);
  const caller = createCallerFactory(appRouter)({ db });
  return { caller, sqlite };
}

describe("category router", () => {
  it("creating a profile seeds 10 predefined categories", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    expect(cats).toHaveLength(10);
    expect(cats.map((c) => c.name)).toEqual(expect.arrayContaining(PREDEFINED_CATEGORIES));
    sqlite.close();
  });

  it("categories are scoped to the profile", async () => {
    const { caller, sqlite } = makeTestCaller();
    const p1 = await caller.profile.create({ name: "Alice" });
    const p2 = await caller.profile.create({ name: "Bob" });
    const cats = await caller.category.list({ profileId: p1.id });
    expect(cats.every((c) => c.profileId === p1.id)).toBe(true);
    const cats2 = await caller.category.list({ profileId: p2.id });
    expect(cats2.every((c) => c.profileId === p2.id)).toBe(true);
    sqlite.close();
  });

  it("can create a custom category", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cat = await caller.category.create({ profileId: profile.id, name: "Pets" });
    expect(cat.name).toBe("Pets");
    expect(cat.profileId).toBe(profile.id);
    sqlite.close();
  });

  it("can rename a category", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cats = await caller.category.list({ profileId: profile.id });
    const food = cats.find((c) => c.name === "Food")!;
    const updated = await caller.category.rename({ id: food.id, name: "Groceries" });
    expect(updated.name).toBe("Groceries");
    sqlite.close();
  });

  it("can delete a category", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cat = await caller.category.create({ profileId: profile.id, name: "Pets" });
    await caller.category.delete({ id: cat.id });
    const cats = await caller.category.list({ profileId: profile.id });
    expect(cats.find((c) => c.id === cat.id)).toBeUndefined();
    sqlite.close();
  });
});

describe("credit card router", () => {
  it("list returns empty when no cards exist", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const cards = await caller.creditCard.list({ profileId: profile.id });
    expect(cards).toHaveLength(0);
    sqlite.close();
  });

  it("can create a credit card", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });
    expect(card.name).toBe("Nubank");
    expect(card.profileId).toBe(profile.id);
    sqlite.close();
  });

  it("can rename a credit card", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });
    const updated = await caller.creditCard.rename({ id: card.id, name: "Nubank Ultravioleta" });
    expect(updated.name).toBe("Nubank Ultravioleta");
    sqlite.close();
  });

  it("can delete a credit card", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const card = await caller.creditCard.create({ profileId: profile.id, name: "Nubank" });
    await caller.creditCard.delete({ id: card.id });
    const cards = await caller.creditCard.list({ profileId: profile.id });
    expect(cards).toHaveLength(0);
    sqlite.close();
  });
});
