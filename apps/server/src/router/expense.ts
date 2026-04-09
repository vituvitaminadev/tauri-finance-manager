import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { expenseEntries } from "../db/schema";

const paymentMethodEnum = z.enum(["debit", "pix", "boleto", "cash", "credit_card"]);

export const expenseRouter = router({
  list: publicProcedure
    .input(z.object({ profileId: z.number(), year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(expenseEntries)
        .where(
          and(
            eq(expenseEntries.profileId, input.profileId),
            eq(expenseEntries.year, input.year),
            eq(expenseEntries.month, input.month)
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
      paymentMethod: paymentMethodEnum,
      categoryId: z.number().nullable().optional(),
      creditCardId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .insert(expenseEntries)
        .values({
          profileId: input.profileId,
          year: input.year,
          month: input.month,
          name: input.name,
          amountCents: input.amountCents,
          paymentMethod: input.paymentMethod,
          categoryId: input.categoryId ?? null,
          creditCardId: input.creditCardId ?? null,
        })
        .returning();
      return entry;
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      amountCents: z.number().int().min(0).optional(),
      paymentMethod: paymentMethodEnum.optional(),
      categoryId: z.number().nullable().optional(),
      creditCardId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [entry] = await ctx.db
        .update(expenseEntries)
        .set(fields)
        .where(eq(expenseEntries.id, id))
        .returning();
      return entry;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(expenseEntries).where(eq(expenseEntries.id, input.id));
    }),
});
