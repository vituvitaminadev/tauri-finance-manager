import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./router/index";
import "./db/index"; // runs migrations on startup

const PORT = Number(process.env.PORT ?? 3001);

const app = new Hono();

app.use(
  "/trpc/*",
  cors({
    origin: ["http://localhost:1420", "tauri://localhost"],
  })
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: () => ({}),
  })
);

app.get("/health", (c) => c.json({ ok: true }));

export default {
  port: PORT,
  fetch: app.fetch,
};

console.log(`Server running on http://localhost:${PORT}`);
