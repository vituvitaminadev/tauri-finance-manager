import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { profiles, categories } from "../db/schema";
import { PREDEFINED_CATEGORIES } from "./category";

export const profileRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(profiles);
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .insert(profiles)
        .values({ name: input.name, theme: "light" })
        .returning();
      // Seed predefined categories for the new profile
      await ctx.db.insert(categories).values(
        PREDEFINED_CATEGORIES.map((name) => ({ profileId: profile.id, name }))
      );
      return profile;
    }),

  rename: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .update(profiles)
        .set({ name: input.name })
        .where(eq(profiles.id, input.id))
        .returning();
      return profile;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(profiles).where(eq(profiles.id, input.id));
    }),

  setTheme: publicProcedure
    .input(z.object({ id: z.number(), theme: z.enum(["light", "dark"]) }))
    .mutation(async ({ ctx, input }) => {
      const [profile] = await ctx.db
        .update(profiles)
        .set({ theme: input.theme })
        .where(eq(profiles.id, input.id))
        .returning();
      return profile;
    }),
});
