import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  theme: text("theme", { enum: ["light", "dark"] }).notNull().default("light"),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const creditCards = sqliteTable("credit_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const incomeEntries = sqliteTable("income_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
});

export const recurringIncome = sqliteTable("recurring_income", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const fixedExpenses = sqliteTable("fixed_expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paymentMethod: text("payment_method", {
    enum: ["debit", "pix", "boleto", "cash", "credit_card"],
  }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  creditCardId: integer("credit_card_id").references(() => creditCards.id, { onDelete: "set null" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const categoryLimits = sqliteTable("category_limits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  limitCents: integer("limit_cents").notNull(),
});

export const expenseEntries = sqliteTable("expense_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  name: text("name").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paymentMethod: text("payment_method", {
    enum: ["debit", "pix", "boleto", "cash", "credit_card"],
  }).notNull(),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  creditCardId: integer("credit_card_id").references(() => creditCards.id, { onDelete: "set null" }),
  fixedExpenseId: integer("fixed_expense_id"),
  installmentGroupId: integer("installment_group_id"),
  installmentIndex: integer("installment_index"),
  installmentTotal: integer("installment_total"),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type ExpenseEntry = typeof expenseEntries.$inferSelect;
export type CategoryLimit = typeof categoryLimits.$inferSelect;
export type RecurringIncome = typeof recurringIncome.$inferSelect;
export type FixedExpense = typeof fixedExpenses.$inferSelect;
