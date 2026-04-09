import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { investmentGoals, investmentContributions } from "../db/schema";

export const investmentRouter = router({
  listGoals: publicProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(investmentGoals)
        .where(and(eq(investmentGoals.profileId, input.profileId), eq(investmentGoals.archived, false)));
    }),

  createGoal: publicProcedure
    .input(z.object({ profileId: z.number(), name: z.string().min(1), targetCents: z.number().int().min(0).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [goal] = await ctx.db
        .insert(investmentGoals)
        .values({ profileId: input.profileId, name: input.name, targetCents: input.targetCents ?? null })
        .returning();
      return goal;
    }),

  archiveGoal: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [goal] = await ctx.db
        .update(investmentGoals)
        .set({ archived: true })
        .where(eq(investmentGoals.id, input.id))
        .returning();
      return goal;
    }),

  getGoalTotals: publicProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ ctx, input }) => {
      const goals = await ctx.db
        .select({ id: investmentGoals.id })
        .from(investmentGoals)
        .where(eq(investmentGoals.profileId, input.profileId));

      const rows = await ctx.db
        .select({
          goalId: investmentContributions.goalId,
          totalCents: sql<number>`sum(${investmentContributions.amountCents})`,
        })
        .from(investmentContributions)
        .where(sql`${investmentContributions.goalId} IN (${goals.map((g) => g.id).join(",") || "0"})`)
        .groupBy(investmentContributions.goalId);

      return rows;
    }),

  addContribution: publicProcedure
    .input(z.object({
      goalId: z.number(),
      year: z.number(),
      month: z.number(),
      amountCents: z.number().int().min(0),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [contrib] = await ctx.db
        .insert(investmentContributions)
        .values({ ...input, note: input.note ?? null })
        .returning();
      return contrib;
    }),

  updateContribution: publicProcedure
    .input(z.object({ id: z.number(), amountCents: z.number().int().min(0).optional(), note: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [contrib] = await ctx.db
        .update(investmentContributions)
        .set(fields)
        .where(eq(investmentContributions.id, id))
        .returning();
      return contrib;
    }),

  deleteContribution: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(investmentContributions).where(eq(investmentContributions.id, input.id));
    }),

  listContributions: publicProcedure
    .input(z.object({ goalId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(investmentContributions)
        .where(eq(investmentContributions.goalId, input.goalId));
    }),
});
