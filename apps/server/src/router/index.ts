import { router, publicProcedure } from "./trpc";
import { profileRouter } from "./profile";

export { router, publicProcedure, createCallerFactory } from "./trpc";
export type { Context } from "./trpc";

const healthRouter = router({
  ping: publicProcedure.query(() => "pong" as const),
});

export const appRouter = router({
  health: healthRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
