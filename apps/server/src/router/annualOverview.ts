import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { incomeEntries, expenseEntries, investmentContributions, investmentGoals } from "../db/schema";

export const annualOverviewRouter = router({
  yearly: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number() }))
    .query(async ({ ctx, input }) => {
      const { profileId, year } = input;

      // Monthly income aggregation
      const incomeByMonth = await ctx.db
        .select({
          month: incomeEntries.month,
          totalCents: sql<number>`coalesce(sum(${incomeEntries.amountCents}), 0)`,
        })
        .from(incomeEntries)
        .where(and(eq(incomeEntries.profileId, profileId), eq(incomeEntries.year, year)))
        .groupBy(incomeEntries.month);

      // Monthly expense aggregation
      const expensesByMonth = await ctx.db
        .select({
          month: expenseEntries.month,
          totalCents: sql<number>`coalesce(sum(${expenseEntries.amountCents}), 0)`,
        })
        .from(expenseEntries)
        .where(and(eq(expenseEntries.profileId, profileId), eq(expenseEntries.year, year)))
        .groupBy(expenseEntries.month);

      // Per-category totals for the year
      const categoryTotals = await ctx.db
        .select({
          categoryId: expenseEntries.categoryId,
          totalCents: sql<number>`sum(${expenseEntries.amountCents})`,
        })
        .from(expenseEntries)
        .where(and(eq(expenseEntries.profileId, profileId), eq(expenseEntries.year, year)))
        .groupBy(expenseEntries.categoryId)
        .then((rows) => rows.filter((r) => r.categoryId !== null) as { categoryId: number; totalCents: number }[]);

      // Investment contributions per goal per month
      const goals = await ctx.db
        .select({ id: investmentGoals.id })
        .from(investmentGoals)
        .where(eq(investmentGoals.profileId, profileId));

      let investByGoalMonth: { goalId: number; month: number; totalCents: number }[] = [];
      if (goals.length > 0) {
        investByGoalMonth = await ctx.db
          .select({
            goalId: investmentContributions.goalId,
            month: investmentContributions.month,
            totalCents: sql<number>`sum(${investmentContributions.amountCents})`,
          })
          .from(investmentContributions)
          .where(
            and(
              sql`${investmentContributions.goalId} IN (${goals.map((g) => g.id).join(",")})`,
              eq(investmentContributions.year, year)
            )
          )
          .groupBy(investmentContributions.goalId, investmentContributions.month) as { goalId: number; month: number; totalCents: number }[];
      }

      // Build 12-month array
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const income = incomeByMonth.find((r) => r.month === m)?.totalCents ?? 0;
        const expenses = expensesByMonth.find((r) => r.month === m)?.totalCents ?? 0;
        return { month: m, incomeCents: income, expensesCents: expenses, differenceCents: income - expenses };
      });

      const totalIncomeCents = months.reduce((s, m) => s + m.incomeCents, 0);
      const totalExpensesCents = months.reduce((s, m) => s + m.expensesCents, 0);

      // Find highest/lowest expense months (only among months with data)
      const monthsWithExpenses = months.filter((m) => m.expensesCents > 0);
      const highestExpenseMonth = monthsWithExpenses.length > 0
        ? monthsWithExpenses.reduce((a, b) => a.expensesCents >= b.expensesCents ? a : b).month
        : null;
      const lowestExpenseMonth = monthsWithExpenses.length > 0
        ? monthsWithExpenses.reduce((a, b) => a.expensesCents <= b.expensesCents ? a : b).month
        : null;

      // Top category
      const topCategoryId = categoryTotals.length > 0
        ? categoryTotals.reduce((a, b) => a.totalCents >= b.totalCents ? a : b).categoryId
        : null;

      return {
        totalIncomeCents,
        totalExpensesCents,
        netBalanceCents: totalIncomeCents - totalExpensesCents,
        months,
        highestExpenseMonth,
        lowestExpenseMonth,
        topCategoryId,
        categoryTotals,
        investmentByGoalMonth: investByGoalMonth,
      };
    }),
});
