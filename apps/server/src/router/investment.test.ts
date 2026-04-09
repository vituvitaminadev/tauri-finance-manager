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

describe("investment router", () => {
  it("can create and list investment goals", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Emergency Fund", targetCents: 1000000 });
    expect(goal.name).toBe("Emergency Fund");
    expect(goal.targetCents).toBe(1000000);
    expect(goal.archived).toBe(false);
    const goals = await caller.investment.listGoals({ profileId: profile.id });
    expect(goals).toHaveLength(1);
    sqlite.close();
  });

  it("supports goals without a target amount", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Stocks" });
    expect(goal.targetCents).toBeNull();
    sqlite.close();
  });

  it("total accumulated is the sum of all contributions", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Fund", targetCents: 500000 });
    await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 1, amountCents: 100000 });
    await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 2, amountCents: 150000 });
    await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 3, amountCents: 50000 });

    const totals = await caller.investment.getGoalTotals({ profileId: profile.id });
    const goalTotal = totals.find((t) => t.goalId === goal.id);
    expect(goalTotal?.totalCents).toBe(300000);
    sqlite.close();
  });

  it("deleting a contribution recalculates the total", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Fund" });
    const c1 = await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 1, amountCents: 100000 });
    await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 2, amountCents: 50000 });

    await caller.investment.deleteContribution({ id: c1.id });

    const totals = await caller.investment.getGoalTotals({ profileId: profile.id });
    expect(totals.find((t) => t.goalId === goal.id)?.totalCents).toBe(50000);
    sqlite.close();
  });

  it("can archive a goal", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Old Goal" });
    await caller.investment.archiveGoal({ id: goal.id });
    const goals = await caller.investment.listGoals({ profileId: profile.id });
    expect(goals.find((g) => g.id === goal.id)).toBeUndefined();
    sqlite.close();
  });

  it("can edit a contribution", async () => {
    const { caller, sqlite } = makeTestCaller();
    const profile = await caller.profile.create({ name: "Alice" });
    const goal = await caller.investment.createGoal({ profileId: profile.id, name: "Fund" });
    const c = await caller.investment.addContribution({ goalId: goal.id, year: 2026, month: 1, amountCents: 10000, note: "First" });
    const updated = await caller.investment.updateContribution({ id: c.id, amountCents: 20000, note: "Updated" });
    expect(updated.amountCents).toBe(20000);
    expect(updated.note).toBe("Updated");
    sqlite.close();
  });
});
