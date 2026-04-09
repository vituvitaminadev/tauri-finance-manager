import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { categories, creditCards } from "../db/schema";

export const PREDEFINED_CATEGORIES = [
  "Food", "Health", "Leisure", "Transport", "Housing",
  "Education", "Entertainment", "Clothing", "Subscriptions", "Other",
];

export const categoryRouter = router({
  list: publicProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(categories).where(eq(categories.profileId, input.profileId));
    }),

  create: publicProcedure
    .input(z.object({ profileId: z.number(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [cat] = await ctx.db
        .insert(categories)
        .values({ profileId: input.profileId, name: input.name })
        .returning();
      return cat;
    }),

  rename: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [cat] = await ctx.db
        .update(categories)
        .set({ name: input.name })
        .where(eq(categories.id, input.id))
        .returning();
      return cat;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(categories).where(eq(categories.id, input.id));
    }),
});

export const creditCardRouter = router({
  list: publicProcedure
    .input(z.object({ profileId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.select().from(creditCards).where(eq(creditCards.profileId, input.profileId));
    }),

  create: publicProcedure
    .input(z.object({ profileId: z.number(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .insert(creditCards)
        .values({ profileId: input.profileId, name: input.name })
        .returning();
      return card;
    }),

  rename: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .update(creditCards)
        .set({ name: input.name })
        .where(eq(creditCards.id, input.id))
        .returning();
      return card;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(creditCards).where(eq(creditCards.id, input.id));
    }),
});
