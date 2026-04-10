# PRD: Self-Contained Desktop App

## Problem Statement

The Finance Manager desktop app currently requires two manual steps to run: building the app and starting the backend server separately in a terminal. This makes the app unusable as a distributed desktop product — users must have Node.js installed, know how to run terminal commands, and manually manage the server lifecycle. The app should work like any other installed desktop application: open it and it works, close it and everything stops.

## Solution

Bundle the Node.js backend server as a sidecar binary inside the Tauri app package. When the user opens the app, Tauri automatically spawns the server process in the background. When the user closes the app, Tauri kills the server. The user installs one package and never interacts with a terminal.

The server binary is compiled with Bun's single-executable compiler (`bun build --compile`), which handles native Node modules (such as `better-sqlite3`) that standard Node SEA cannot bundle. The frontend displays a loading screen while polling the server's health endpoint, ensuring users never see connection errors during startup.

## User Stories

1. As a user, I want to install the Finance Manager app once, so that I never need to set up a development environment or run terminal commands.
2. As a user, I want the app to start fully on its own when I open it, so that I can use it immediately without any manual steps.
3. As a user, I want the server to stop automatically when I close the app, so that no background processes keep running on my machine.
4. As a user, I want to see a loading indicator when the app is starting, so that I know the app is initializing and not frozen.
5. As a user, I want the app to work on Linux, so that I can use it on my primary operating system.
6. As a user, I want the app to work on Windows, so that I can use it on any machine I own.
7. As a user, I want my existing financial data to be preserved after the upgrade, so that I don't lose any history.
8. As a developer, I want the server bundling to happen automatically as part of the build pipeline, so that I never accidentally ship an outdated sidecar binary.
9. As a developer, I want to cross-compile the server binary for Linux and Windows from a single machine, so that I don't need separate build environments.
10. As a developer, I want the server code to remain unchanged, so that all existing functionality and tests continue to work.

## Implementation Decisions

### Modules to Build or Modify

**1. Server Build Script (new)**
A script in the server package that uses `bun build --compile` to produce standalone executables for Linux (`x86_64`) and Windows (`x86_64`). Bun supports cross-compilation natively via `--target` flags. Output binaries go into the Tauri binaries directory, named according to Tauri's sidecar target-triple convention.

**2. Tauri Configuration (`tauri.conf.json`)**
- Register the server binary as an external binary (sidecar) with the correct target-triple names.
- Update `beforeBuildCommand` to run the sidecar build script before the existing frontend build.
- Add `shell` plugin permissions to allow spawning the sidecar.

**3. Rust App Core (`lib.rs`)**
- Add `tauri-plugin-shell` dependency.
- In the `setup` hook: spawn the sidecar process using the shell plugin's sidecar API.
- Store the child process handle so Tauri can kill it on exit (the plugin handles this automatically when the app window closes).
- Expose a Tauri command `wait_for_server` that polls the server's `/health` endpoint in a loop with a short delay until it responds, then returns. This is the synchronization point between the Rust side and the frontend.

**4. Frontend Loading Screen (new component)**
- On app startup, call the `wait_for_server` Tauri command via `@tauri-apps/api/core`.
- While waiting, render a centered loading indicator (spinner + "Starting…" message).
- Once the command resolves, render the normal app.
- This wraps the root of the React tree so no page or route renders before the server is ready.

### Technical Decisions

- **Port:** Fixed at `3001`. Conflict risk is acceptable for a single-user desktop app; dynamic port adds complexity with no meaningful benefit.
- **Bundler:** `bun build --compile` chosen over Node SEA because Node SEA cannot package native `.node` addons (required by `better-sqlite3`).
- **Shutdown:** Tauri kills the sidecar process automatically when the app exits. No graceful shutdown protocol is needed — `better-sqlite3` uses synchronous writes; there are no open transactions or unflushed buffers at the OS level.
- **Cross-compilation:** Bun supports `--target=bun-linux-x64` and `--target=bun-windows-x64` from any host OS, so a single CI runner or developer machine can produce both binaries.
- **No changes to server code:** The server (`src/index.ts`, all routers, DB layer) is compiled as-is. The only change is *how* it is executed (Bun runtime embedded in binary vs. external Node.js).

### Architecture

```
Tauri App (Rust)
  └── spawns → server binary (Bun-compiled Node.js)
                  └── listens on localhost:3001
                        └── tRPC over HTTP
React Frontend
  └── wait_for_server (Tauri IPC) → polls /health
  └── tRPC client → http://localhost:3001/trpc
```

## Testing Decisions

**What makes a good test:** Tests must verify observable behavior through public interfaces. A test should describe what the system does, not how it does it internally. Tests must survive internal refactors — if renaming a private function breaks a test, the test is wrong.

### Modules to Test

**`wait_for_server` Tauri command**
- Behavior: resolves successfully when the server health endpoint returns `{ ok: true }`.
- Behavior: keeps polling and does not resolve while the server is not yet up.
- Test approach: integration test using Tauri's test harness, or unit test mocking the HTTP call at the HTTP client boundary.

**Frontend Loading Screen**
- Behavior: renders loading UI while `wait_for_server` is pending.
- Behavior: renders app content once `wait_for_server` resolves.
- Test approach: React Testing Library, mock the Tauri IPC invoke at the `@tauri-apps/api/core` boundary (not internal state).

**Server Build Script**
- Behavior: produces a binary at the expected output path for each target platform.
- Test approach: shell integration test or CI check that verifies the binary exists and responds to `--version` or a health check after spawn.

### Prior Art

The server already has Vitest tests in `apps/server/`. Frontend component tests can follow the same React Testing Library pattern used elsewhere in `apps/desktop/src/`.

## Out of Scope

- macOS support (can be added later by adding the `bun-darwin-x64`/`bun-darwin-arm64` targets).
- Auto-update of the app binary.
- Graceful shutdown / in-flight request draining.
- Dynamic port allocation.
- Multiple simultaneous app instances.
- Switching from `better-sqlite3` to Bun's native SQLite API (valid future improvement, separate PRD).

## Further Notes

- Bun must be installed on the developer's machine and in CI to run the sidecar build step. This is a new build-time dependency.
- The sidecar binaries (compiled executables) should be added to `.gitignore` — they are build artifacts, not source.
- The Tauri `allowlist` / capabilities system (Tauri v2) requires explicitly granting `shell:allow-execute` and `shell:allow-kill` for the sidecar binary name in the capabilities config.
- After this change, `pnpm dev` (which runs the server with `tsx watch`) continues to work for development. The sidecar path only activates in production builds.
