import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { incomeEntries } from "../db/schema";

export const incomeRouter = router({
  list: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(incomeEntries)
        .where(
          and(
            eq(incomeEntries.profileId, input.profileId),
            eq(incomeEntries.year, input.year),
            eq(incomeEntries.month, input.month)
          )
        );
    }),

  create: publicProcedure
    .input(z.object({
      profileId: z.number(),
      year: z.number(),
      month: z.number(),
      name: z.string().min(1),
      amountCents: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .insert(incomeEntries)
        .values(input)
        .returning();
      return entry;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      amountCents: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [entry] = await ctx.db
        .update(incomeEntries)
        .set(fields)
        .where(eq(incomeEntries.id, id))
        .returning();
      return entry;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(incomeEntries).where(eq(incomeEntries.id, input.id));
    }),
});
