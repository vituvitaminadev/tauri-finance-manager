import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { categoryLimits, expenseEntries } from "../db/schema";

export const categoryLimitRouter = router({
  getMonthLimits: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(categoryLimits)
        .where(
          and(
            eq(categoryLimits.profileId, input.profileId),
            eq(categoryLimits.year, input.year),
            eq(categoryLimits.month, input.month)
          )
        );
    }),

  setLimit: publicProcedure
    .input(z.object({
      profileId: z.number(),
      categoryId: z.number(),
      year: z.number(),
      month: z.number(),
      limitCents: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [limit] = await ctx.db
        .insert(categoryLimits)
        .values(input)
        .onConflictDoUpdate({
          target: [categoryLimits.profileId, categoryLimits.categoryId, categoryLimits.year, categoryLimits.month],
          set: { limitCents: input.limitCents },
        })
        .returning();
      return limit;
    }),

  getCategorySpending: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          categoryId: expenseEntries.categoryId,
          spentCents: sql<number>`sum(${expenseEntries.amountCents})`,
        })
        .from(expenseEntries)
        .where(
          and(
            eq(expenseEntries.profileId, input.profileId),
            eq(expenseEntries.year, input.year),
            eq(expenseEntries.month, input.month)
          )
        )
        .groupBy(expenseEntries.categoryId);
      return rows.filter((r) => r.categoryId !== null) as { categoryId: number; spentCents: number }[];
    }),
});
