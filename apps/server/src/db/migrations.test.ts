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
