import { z } from "zod";
import { eq, and, gt } from "drizzle-orm";
import { router, publicProcedure } from "./trpc";
import { installmentGroups, expenseEntries } from "../db/schema";

export const installmentRouter = router({
  create: publicProcedure
    .input(z.object({
      profileId: z.number(),
      name: z.string().min(1),
      totalAmountCents: z.number().int().min(1),
      installments: z.number().int().min(1),
      startYear: z.number(),
      startMonth: z.number().min(1).max(12),
      creditCardId: z.number().optional(),
      categoryId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Create installment group
      const [group] = await ctx.db.insert(installmentGroups).values({
        profileId: input.profileId,
        name: input.name,
        totalInstallments: input.installments,
        categoryId: input.categoryId,
        creditCardId: input.creditCardId,
      }).returning();

      const perInstallmentCents = Math.round(input.totalAmountCents / input.installments);
      const entries = [];

      for (let i = 0; i < input.installments; i++) {
        let month = input.startMonth + i;
        let year = input.startYear;
        while (month > 12) { month -= 12; year += 1; }

        entries.push({
          profileId: input.profileId,
          year,
          month,
          name: `${input.name} (${i + 1}/${input.installments})`,
          amountCents: perInstallmentCents,
          paymentMethod: "credit_card" as const,
          categoryId: input.categoryId ?? null,
          creditCardId: input.creditCardId ?? null,
          installmentGroupId: group.id,
          installmentIndex: i + 1,
          installmentTotal: input.installments,
        });
      }

      await ctx.db.insert(expenseEntries).values(entries);
      return group;
    }),

  cancelFrom: publicProcedure
    .input(z.object({ expenseEntryId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get the expense entry to find group and index
      const [entry] = await ctx.db
        .select()
        .from(expenseEntries)
        .where(eq(expenseEntries.id, input.expenseEntryId));

      if (!entry?.installmentGroupId || !entry?.installmentIndex) return;

      // Delete all entries in the group with index >= this entry's index
      await ctx.db.delete(expenseEntries).where(
        and(
          eq(expenseEntries.installmentGroupId, entry.installmentGroupId),
          gt(expenseEntries.installmentIndex, entry.installmentIndex - 1)
        )
      );
    }),
});
