import { describe, it, expect } from "vitest";
import { appRouter, createCallerFactory } from "./index";

const createCaller = createCallerFactory(appRouter);
const caller = createCaller({});

describe("health router", () => {
  it("ping returns pong", async () => {
    const result = await caller.health.ping();
    expect(result).toBe("pong");
  });
});
