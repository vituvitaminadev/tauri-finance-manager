## Parent PRD

[../PRD.md](../PRD.md)

## What to build

Set up the complete project foundation that all other slices depend on. This includes the Tauri 2.x desktop shell, the Vite + React + TypeScript frontend, the HonoJS backend running inside the Tauri process, tRPC wiring between frontend and backend, Drizzle ORM connected to a local SQLite database, shadcn/ui with Tailwind CSS, and TanStack Router + TanStack Query for frontend navigation and data fetching.

The key architectural decision to resolve before implementation: **how does HonoJS run inside Tauri?** Two options:
- **Node.js sidecar**: A separate Node process running HonoJS, bundled with the Tauri app, communicating with the frontend via HTTP on localhost. Uses `better-sqlite3` for SQLite access.
- **Rust-native SQLite via `tauri-plugin-sql`**: No Node sidecar; SQLite is accessed directly from Rust. The frontend calls Tauri commands instead of HTTP. HonoJS and tRPC would only exist on the frontend (no separate backend server).

This decision affects the entire stack and must be made before writing any feature code.

The deliverable is a running app shell with:
- A placeholder home screen (no real features)
- Drizzle migrations running automatically on startup
- HonoJS + tRPC reachable from the frontend (proven with a `health` procedure)
- shadcn/ui theme provider wired up
- TanStack Router with at least one working route

## Acceptance criteria

- [ ] `tauri dev` starts the app without errors
- [ ] A `health.ping()` tRPC procedure returns successfully from the frontend
- [ ] Drizzle runs migrations on startup (even if no tables exist yet)
- [ ] shadcn/ui renders correctly in both light and dark mode
- [ ] TanStack Router renders a placeholder home route
- [ ] Architecture decision (sidecar vs tauri-plugin-sql) is documented in a `ARCHITECTURE.md` file at the project root

## Blocked by

None — can start immediately.

## User stories addressed

This slice enables all user stories. No user-facing features are delivered directly.
