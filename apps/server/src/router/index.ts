import { router, publicProcedure } from "./trpc";
import { profileRouter } from "./profile";
import { categoryRouter, creditCardRouter } from "./category";
import { incomeRouter } from "./income";
import { expenseRouter } from "./expense";
import { categoryLimitRouter } from "./categoryLimit";
import { recurringIncomeRouter, fixedExpenseRouter } from "./recurring";
import { autoLaunchRouter } from "./autoLaunch";
import { installmentRouter } from "./installment";
import { investmentRouter } from "./investment";

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
  categoryLimit: categoryLimitRouter,
  recurringIncome: recurringIncomeRouter,
  fixedExpense: fixedExpenseRouter,
  autoLaunch: autoLaunchRouter,
  installment: installmentRouter,
  investment: investmentRouter,
});

export type AppRouter = typeof appRouter;
