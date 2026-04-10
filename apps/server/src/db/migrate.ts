interface RawSQLiteConnection {
  exec(sql: string): unknown;
  prepare(sql: string): { all(): unknown[] };
}

export function runMigrations(sqlite: RawSQLiteConnection): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT 'light'
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS credit_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS recurring_income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE SET NULL,
      active INTEGER NOT NULL DEFAULT 1
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS income_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL
    )
  `);

  // Add recurring_income_id column to income_entries if not present (idempotent)
  const incomeColumns = sqlite.prepare("PRAGMA table_info(income_entries)").all() as { name: string }[];
  if (!incomeColumns.find((c) => c.name === "recurring_income_id")) {
    sqlite.exec(`ALTER TABLE income_entries ADD COLUMN recurring_income_id INTEGER REFERENCES recurring_income(id) ON DELETE SET NULL`);
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS investment_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_cents INTEGER,
      archived INTEGER NOT NULL DEFAULT 0
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS investment_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL REFERENCES investment_goals(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      note TEXT
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS installment_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      total_installments INTEGER NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE SET NULL
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS month_initializations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      UNIQUE(profile_id, year, month)
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS category_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      limit_cents INTEGER NOT NULL,
      UNIQUE(profile_id, category_id, year, month)
    )
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS expense_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE SET NULL,
      fixed_expense_id INTEGER REFERENCES fixed_expenses(id) ON DELETE SET NULL,
      installment_group_id INTEGER,
      installment_index INTEGER,
      installment_total INTEGER
    )
  `);
}
