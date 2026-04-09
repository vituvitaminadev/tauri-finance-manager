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

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type CreditCard = typeof creditCards.$inferSelect;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
