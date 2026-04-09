import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { recurringIncome, fixedExpenses } from "../db/schema";

export const recurringIncomeRouter = router({
  list: publicProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(recurringIncome).where(eq(recurringIncome.profileId, input.profileId));
    }),

  create: publicProcedure
    .input(z.object({ profileId: z.number(), name: z.string().min(1), amountCents: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const [t] = await ctx.db.insert(recurringIncome).values(input).returning();
      return t;
    }),

  update: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).optional(), amountCents: z.number().int().min(0).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [t] = await ctx.db.update(recurringIncome).set(fields).where(eq(recurringIncome.id, id)).returning();
      return t;
    }),

  deactivate: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [t] = await ctx.db.update(recurringIncome).set({ active: false }).where(eq(recurringIncome.id, input.id)).returning();
      return t;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(recurringIncome).where(eq(recurringIncome.id, input.id));
    }),
});

const paymentMethodEnum = z.enum(["debit", "pix", "boleto", "cash", "credit_card"]);

export const fixedExpenseRouter = router({
  list: publicProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(fixedExpenses).where(eq(fixedExpenses.profileId, input.profileId));
    }),

  create: publicProcedure
    .input(z.object({
      profileId: z.number(),
      name: z.string().min(1),
      amountCents: z.number().int().min(0),
      paymentMethod: paymentMethodEnum,
      categoryId: z.number().nullable().optional(),
      creditCardId: z.number().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [t] = await ctx.db.insert(fixedExpenses).values({
        profileId: input.profileId,
        name: input.name,
        amountCents: input.amountCents,
        paymentMethod: input.paymentMethod,
        categoryId: input.categoryId ?? null,
        creditCardId: input.creditCardId ?? null,
      }).returning();
      return t;
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
      const [t] = await ctx.db.update(fixedExpenses).set(fields).where(eq(fixedExpenses.id, id)).returning();
      return t;
    }),

  deactivate: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [t] = await ctx.db.update(fixedExpenses).set({ active: false }).where(eq(fixedExpenses.id, input.id)).returning();
      return t;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(fixedExpenses).where(eq(fixedExpenses.id, input.id));
    }),
});
