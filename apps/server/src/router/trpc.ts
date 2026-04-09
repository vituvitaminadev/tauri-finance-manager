import { initTRPC } from "@trpc/server";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

export interface Context {
  db: BetterSQLite3Database;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
