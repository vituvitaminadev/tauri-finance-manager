import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { monthInitializations, recurringIncome, fixedExpenses, incomeEntries, expenseEntries } from "../db/schema";

export const autoLaunchRouter = router({
  initMonth: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number(), month: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { profileId, year, month } = input;

      // Check if already initialized
      const existing = await ctx.db
        .select()
        .from(monthInitializations)
        .where(
          and(
            eq(monthInitializations.profileId, profileId),
            eq(monthInitializations.year, year),
            eq(monthInitializations.month, month)
          )
        );

      if (existing.length > 0) return { initialized: false };

      // Get active templates
      const activeIncome = await ctx.db
        .select()
        .from(recurringIncome)
        .where(and(eq(recurringIncome.profileId, profileId), eq(recurringIncome.active, true)));

      const activeExpenses = await ctx.db
        .select()
        .from(fixedExpenses)
        .where(and(eq(fixedExpenses.profileId, profileId), eq(fixedExpenses.active, true)));

      // Create income entries
      if (activeIncome.length > 0) {
        await ctx.db.insert(incomeEntries).values(
          activeIncome.map((t) => ({
            profileId,
            year,
            month,
            name: t.name,
            amountCents: t.amountCents,
            recurringIncomeId: t.id,
          }))
        );
      }

      // Create expense entries
      if (activeExpenses.length > 0) {
        await ctx.db.insert(expenseEntries).values(
          activeExpenses.map((t) => ({
            profileId,
            year,
            month,
            name: t.name,
            amountCents: t.amountCents,
            paymentMethod: t.paymentMethod,
            categoryId: t.categoryId,
            creditCardId: t.creditCardId,
            fixedExpenseId: t.id,
          }))
        );
      }

      // Mark as initialized
      await ctx.db.insert(monthInitializations).values({ profileId, year, month });

      return { initialized: true };
    }),
});
