import { describe, it, expect } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { runMigrations } from "./migrate";

describe("drizzle migrations", () => {
  it("runs without error on a fresh database", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    expect(() => runMigrations(db, sqlite)).not.toThrow();
    sqlite.close();
  });

  it("is idempotent — running twice does not throw", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);
    expect(() => runMigrations(db, sqlite)).not.toThrow();
    sqlite.close();
  });

  it("creates the profiles table with id, name, and theme columns", () => {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'dark')`);
    const row = sqlite.prepare("SELECT * FROM profiles WHERE name = 'Alice'").get() as {
      id: number;
      name: string;
      theme: string;
    };
    expect(row.name).toBe("Alice");
    expect(row.theme).toBe("dark");
    expect(typeof row.id).toBe("number");
    sqlite.close();
  });

  it("creates categories table scoped to profiles with cascade delete", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE name = 'Alice'").get() as { id: number };
    sqlite.exec(`INSERT INTO categories (profile_id, name) VALUES (${profile.id}, 'Food')`);
    const cat = sqlite.prepare("SELECT * FROM categories WHERE profile_id = ?").get(profile.id) as {
      id: number;
      profile_id: number;
      name: string;
    };
    expect(cat.name).toBe("Food");
    expect(cat.profile_id).toBe(profile.id);

    // Cascade delete
    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    const remaining = sqlite.prepare("SELECT * FROM categories WHERE profile_id = ?").all(profile.id);
    expect(remaining).toHaveLength(0);
    sqlite.close();
  });

  it("creates income_entries table scoped to profiles", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };
    sqlite.exec(`INSERT INTO income_entries (profile_id, year, month, name, amount_cents) VALUES (${profile.id}, 2026, 4, 'Salary', 500000)`);
    const entry = sqlite.prepare("SELECT * FROM income_entries WHERE profile_id = ?").get(profile.id) as {
      id: number; profile_id: number; year: number; month: number; name: string; amount_cents: number;
    };
    expect(entry.name).toBe("Salary");
    expect(entry.amount_cents).toBe(500000);
    expect(entry.year).toBe(2026);
    expect(entry.month).toBe(4);

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    const remaining = sqlite.prepare("SELECT * FROM income_entries WHERE profile_id = ?").all(profile.id);
    expect(remaining).toHaveLength(0);
    sqlite.close();
  });

  it("creates expense_entries table with all required columns", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };
    sqlite.exec(`INSERT INTO categories (profile_id, name) VALUES (${profile.id}, 'Food')`);
    const cat = sqlite.prepare("SELECT id FROM categories WHERE profile_id = ?").get(profile.id) as { id: number };

    sqlite.exec(`
      INSERT INTO expense_entries (profile_id, year, month, name, amount_cents, payment_method, category_id)
      VALUES (${profile.id}, 2026, 4, 'Lunch', 2500, 'debit', ${cat.id})
    `);
    const entry = sqlite.prepare("SELECT * FROM expense_entries WHERE profile_id = ?").get(profile.id) as {
      id: number; name: string; amount_cents: number; payment_method: string; category_id: number;
      credit_card_id: number | null; fixed_expense_id: number | null;
      installment_group_id: number | null; installment_index: number | null; installment_total: number | null;
    };
    expect(entry.name).toBe("Lunch");
    expect(entry.amount_cents).toBe(2500);
    expect(entry.payment_method).toBe("debit");
    expect(entry.credit_card_id).toBeNull();
    expect(entry.fixed_expense_id).toBeNull();
    expect(entry.installment_group_id).toBeNull();

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    const remaining = sqlite.prepare("SELECT * FROM expense_entries WHERE profile_id = ?").all(profile.id);
    expect(remaining).toHaveLength(0);
    sqlite.close();
  });

  it("creates category_limits table scoped to profiles", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };
    sqlite.exec(`INSERT INTO categories (profile_id, name) VALUES (${profile.id}, 'Food')`);
    const cat = sqlite.prepare("SELECT id FROM categories WHERE profile_id = ?").get(profile.id) as { id: number };

    sqlite.exec(`INSERT INTO category_limits (profile_id, category_id, year, month, limit_cents) VALUES (${profile.id}, ${cat.id}, 2026, 4, 50000)`);
    const limit = sqlite.prepare("SELECT * FROM category_limits WHERE profile_id = ?").get(profile.id) as {
      id: number; profile_id: number; category_id: number; year: number; month: number; limit_cents: number;
    };
    expect(limit.limit_cents).toBe(50000);
    expect(limit.month).toBe(4);
    expect(limit.year).toBe(2026);

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    const remaining = sqlite.prepare("SELECT * FROM category_limits WHERE profile_id = ?").all(profile.id);
    expect(remaining).toHaveLength(0);
    sqlite.close();
  });

  it("creates recurring_income and fixed_expenses tables", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };

    sqlite.exec(`INSERT INTO recurring_income (profile_id, name, amount_cents, active) VALUES (${profile.id}, 'Salary', 500000, 1)`);
    const ri = sqlite.prepare("SELECT * FROM recurring_income WHERE profile_id = ?").get(profile.id) as {
      id: number; name: string; amount_cents: number; active: number;
    };
    expect(ri.name).toBe("Salary");
    expect(ri.active).toBe(1);

    sqlite.exec(`INSERT INTO categories (profile_id, name) VALUES (${profile.id}, 'Housing')`);
    const cat = sqlite.prepare("SELECT id FROM categories WHERE profile_id = ?").get(profile.id) as { id: number };
    sqlite.exec(`INSERT INTO fixed_expenses (profile_id, name, amount_cents, payment_method, category_id, active) VALUES (${profile.id}, 'Rent', 150000, 'debit', ${cat.id}, 1)`);
    const fe = sqlite.prepare("SELECT * FROM fixed_expenses WHERE profile_id = ?").get(profile.id) as {
      id: number; name: string; amount_cents: number; payment_method: string; active: number;
    };
    expect(fe.name).toBe("Rent");
    expect(fe.payment_method).toBe("debit");

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    expect(sqlite.prepare("SELECT * FROM recurring_income WHERE profile_id = ?").all(profile.id)).toHaveLength(0);
    expect(sqlite.prepare("SELECT * FROM fixed_expenses WHERE profile_id = ?").all(profile.id)).toHaveLength(0);
    sqlite.close();
  });

  it("creates month_initializations table", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };
    sqlite.exec(`INSERT INTO month_initializations (profile_id, year, month) VALUES (${profile.id}, 2026, 4)`);
    const row = sqlite.prepare("SELECT * FROM month_initializations WHERE profile_id = ?").get(profile.id) as { id: number; year: number; month: number };
    expect(row.year).toBe(2026);
    expect(row.month).toBe(4);

    // Unique constraint — cannot insert same month twice
    expect(() => sqlite.exec(`INSERT INTO month_initializations (profile_id, year, month) VALUES (${profile.id}, 2026, 4)`)).toThrow();
    sqlite.close();
  });

  it("creates installment_groups table", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };

    sqlite.exec(`INSERT INTO installment_groups (profile_id, name, total_installments) VALUES (${profile.id}, 'Smart TV', 12)`);
    const group = sqlite.prepare("SELECT * FROM installment_groups WHERE profile_id = ?").get(profile.id) as {
      id: number; name: string; total_installments: number;
    };
    expect(group.name).toBe("Smart TV");
    expect(group.total_installments).toBe(12);

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    expect(sqlite.prepare("SELECT * FROM installment_groups WHERE profile_id = ?").all(profile.id)).toHaveLength(0);
    sqlite.close();
  });

  it("creates investment_goals and investment_contributions tables", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };

    sqlite.exec(`INSERT INTO investment_goals (profile_id, name, target_cents, archived) VALUES (${profile.id}, 'Emergency Fund', 1000000, 0)`);
    const goal = sqlite.prepare("SELECT * FROM investment_goals WHERE profile_id = ?").get(profile.id) as {
      id: number; name: string; target_cents: number | null; archived: number;
    };
    expect(goal.name).toBe("Emergency Fund");
    expect(goal.target_cents).toBe(1000000);
    expect(goal.archived).toBe(0);

    sqlite.exec(`INSERT INTO investment_contributions (goal_id, year, month, amount_cents, note) VALUES (${goal.id}, 2026, 4, 50000, 'April savings')`);
    const contrib = sqlite.prepare("SELECT * FROM investment_contributions WHERE goal_id = ?").get(goal.id) as {
      id: number; amount_cents: number; note: string;
    };
    expect(contrib.amount_cents).toBe(50000);
    expect(contrib.note).toBe("April savings");

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    expect(sqlite.prepare("SELECT * FROM investment_goals WHERE profile_id = ?").all(profile.id)).toHaveLength(0);
    expect(sqlite.prepare("SELECT * FROM investment_contributions WHERE goal_id = ?").all(goal.id)).toHaveLength(0);
    sqlite.close();
  });

  it("creates credit_cards table scoped to profiles with cascade delete", () => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite);
    runMigrations(db, sqlite);

    sqlite.exec(`INSERT INTO profiles (name, theme) VALUES ('Alice', 'light')`);
    const profile = sqlite.prepare("SELECT id FROM profiles WHERE id = last_insert_rowid()").get() as { id: number };
    sqlite.exec(`INSERT INTO credit_cards (profile_id, name) VALUES (${profile.id}, 'Nubank')`);
    const card = sqlite.prepare("SELECT * FROM credit_cards WHERE profile_id = ?").get(profile.id) as {
      id: number;
      profile_id: number;
      name: string;
    };
    expect(card.name).toBe("Nubank");

    sqlite.exec(`DELETE FROM profiles WHERE id = ${profile.id}`);
    const remaining = sqlite.prepare("SELECT * FROM credit_cards WHERE profile_id = ?").all(profile.id);
    expect(remaining).toHaveLength(0);
    sqlite.close();
  });
});
