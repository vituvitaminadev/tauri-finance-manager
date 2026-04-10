import { initTRPC } from "@trpc/server";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

export interface Context {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: BaseSQLiteDatabase<"sync", any>;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
