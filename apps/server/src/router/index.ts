import { router, publicProcedure } from "./trpc";
import { profileRouter } from "./profile";
import { categoryRouter, creditCardRouter } from "./category";
import { incomeRouter } from "./income";
import { expenseRouter } from "./expense";

export { router, publicProcedure, createCallerFactory } from "./trpc";
export type { Context } from "./trpc";

const healthRouter = router({
  ping: publicProcedure.query(() => "pong" as const),
});

export const appRouter = router({
  health: healthRouter,
  profile: profileRouter,
  category: categoryRouter,
  creditCard: creditCardRouter,
  income: incomeRouter,
  expense: expenseRouter,
});

export type AppRouter = typeof appRouter;
