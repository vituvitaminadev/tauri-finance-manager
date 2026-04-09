# Architecture — Finance Manager

## Overview

Finance Manager is a local-first desktop application built with Tauri 2.x. It manages personal financial data (income, expenses, investments) for multiple user profiles, stored in a local SQLite database.

## Architecture Decision: Node.js Sidecar

**Decision**: The backend runs as a **Node.js sidecar process** alongside the Tauri Rust shell.

**Rationale**: The desired tech stack (HonoJS + tRPC + Drizzle ORM) is a Node.js ecosystem. Running it as a sidecar allows the frontend to communicate with the backend over HTTP using standard tRPC patterns, without requiring any Rust bindings for the application logic.

**Rejected alternative — `tauri-plugin-sql` (Rust-native SQLite)**:
- Would require replacing HonoJS and tRPC with Tauri IPC commands
- Breaks the stack consistency with the Node.js ecosystem
- Less ergonomic for typed API contracts

## Process Architecture

```
┌──────────────────────────────────────────────┐
│  Tauri Desktop App                           │
│                                              │
│  ┌────────────────────┐  Spawns              │
│  │   Rust Shell       │──────────────────►  │
│  │   (Tauri 2.x)      │                      │
│  └────────────────────┘                      │
│                                              │
│  ┌────────────────────┐  HTTP localhost:3001 │
│  │   WebView          │◄────────────────────►│
│  │   (React/Vite)     │                      │
│  └────────────────────┘                      │
│                                              │
│  ┌────────────────────┐                      │
│  │   Node.js Sidecar  │                      │
│  │   HonoJS + tRPC    │                      │
│  │   Drizzle + SQLite │                      │
│  └────────────────────┘                      │
└──────────────────────────────────────────────┘
```

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2.x (Rust) |
| Frontend framework | React 18 + TypeScript |
| Frontend build | Vite 5 |
| Frontend routing | TanStack Router |
| Frontend data fetching | TanStack Query |
| API layer | tRPC (over HTTP, httpBatchLink) |
| Backend server | HonoJS |
| ORM | Drizzle ORM |
| Database | SQLite (via better-sqlite3) |
| UI components | shadcn/ui (Radix UI + Tailwind CSS) |
| Charts | shadcn/ui chart components (Recharts) |
| Package manager | pnpm (workspaces) |

## Monorepo Structure

```
finance-manager/
├── apps/
│   ├── desktop/          # Vite + React + Tauri frontend
│   │   ├── src/
│   │   ├── src-tauri/    # Rust Tauri shell
│   │   └── package.json
│   └── server/           # HonoJS + tRPC + Drizzle backend
│       ├── src/
│       │   ├── router/   # tRPC routers
│       │   └── db/       # Drizzle schema + migrations
│       └── package.json
├── issues/               # Implementation issue files
├── PRD.md
├── ARCHITECTURE.md       # This file
└── pnpm-workspace.yaml
```

## Database

- **Location**: `~/.finance-manager/finance.db` (user home directory)
- **Engine**: SQLite via `better-sqlite3`
- **ORM**: Drizzle ORM with automatic migrations on server startup
- **Pragmas**: WAL journal mode, foreign keys enabled

## Communication

The frontend communicates with the backend exclusively via **tRPC over HTTP**.

- **Development**: frontend at `localhost:1420`, backend at `localhost:3001`
- **Production**: backend sidecar is bundled with Tauri and started automatically; frontend uses the same `localhost:3001` address

## System Requirements (Linux)

To run `tauri dev` or build the app, the following system packages must be installed:

```sh
# Arch Linux
yay -S webkit2gtk-4.1 gtk3 libayatana-appindicator

# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev
```

Rust must also be installed via [rustup](https://rustup.rs/).

## Development

```sh
# Install dependencies
pnpm install

# Run backend tests
pnpm test

# Start backend server (development)
pnpm dev:server

# Start frontend only (no Tauri)
pnpm dev:desktop

# Start full Tauri app (requires system deps above)
cd apps/desktop && pnpm tauri:dev
```
