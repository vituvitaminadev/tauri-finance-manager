import { initTRPC } from "@trpc/server";

const t = initTRPC.context<Record<string, never>>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

const healthRouter = router({
  ping: publicProcedure.query(() => "pong" as const),
});

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
