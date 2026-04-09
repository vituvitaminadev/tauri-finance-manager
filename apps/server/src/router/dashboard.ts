import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { incomeEntries, expenseEntries, investmentContributions, investmentGoals } from "../db/schema";

export const dashboardRouter = router({
  monthly: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      const { profileId, year, month } = input;

      // Total income
      const [incomeRow] = await ctx.db
        .select({ total: sql<number>`coalesce(sum(${incomeEntries.amountCents}), 0)` })
        .from(incomeEntries)
        .where(and(eq(incomeEntries.profileId, profileId), eq(incomeEntries.year, year), eq(incomeEntries.month, month)));

      // Total expenses
      const [expenseRow] = await ctx.db
        .select({ total: sql<number>`coalesce(sum(${expenseEntries.amountCents}), 0)` })
        .from(expenseEntries)
        .where(and(eq(expenseEntries.profileId, profileId), eq(expenseEntries.year, year), eq(expenseEntries.month, month)));

      // Expenses by payment method
      const byPaymentMethod = await ctx.db
        .select({
          paymentMethod: expenseEntries.paymentMethod,
          totalCents: sql<number>`sum(${expenseEntries.amountCents})`,
        })
        .from(expenseEntries)
        .where(and(eq(expenseEntries.profileId, profileId), eq(expenseEntries.year, year), eq(expenseEntries.month, month)))
        .groupBy(expenseEntries.paymentMethod);

      // Expenses by category (only non-null categories)
      const byCategory = await ctx.db
        .select({
          categoryId: expenseEntries.categoryId,
          totalCents: sql<number>`sum(${expenseEntries.amountCents})`,
        })
        .from(expenseEntries)
        .where(and(eq(expenseEntries.profileId, profileId), eq(expenseEntries.year, year), eq(expenseEntries.month, month)))
        .groupBy(expenseEntries.categoryId)
        .then((rows) => rows.filter((r) => r.categoryId !== null) as { categoryId: number; totalCents: number }[]);

      // Investment contributions for this month
      const goals = await ctx.db
        .select({ id: investmentGoals.id })
        .from(investmentGoals)
        .where(eq(investmentGoals.profileId, profileId));

      let investmentContribRows: { goalId: number; totalCents: number }[] = [];
      if (goals.length > 0) {
        investmentContribRows = await ctx.db
          .select({
            goalId: investmentContributions.goalId,
            totalCents: sql<number>`sum(${investmentContributions.amountCents})`,
          })
          .from(investmentContributions)
          .where(
            and(
              sql`${investmentContributions.goalId} IN (${goals.map((g) => g.id).join(",")})`,
              eq(investmentContributions.year, year),
              eq(investmentContributions.month, month)
            )
          )
          .groupBy(investmentContributions.goalId) as { goalId: number; totalCents: number }[];
      }

      const totalIncomeCents = incomeRow.total;
      const totalExpensesCents = expenseRow.total;

      return {
        totalIncomeCents,
        totalExpensesCents,
        netBalanceCents: totalIncomeCents - totalExpensesCents,
        expensesByPaymentMethod: byPaymentMethod,
        expensesByCategory: byCategory,
        investmentContributions: investmentContribRows,
      };
    }),
});
