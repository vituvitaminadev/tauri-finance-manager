## Parent PRD

[docs/prd-self-contained-desktop.md](../prd-self-contained-desktop.md)

## What to build

Add a build script to the server package that compiles the Node.js server into standalone executables for Linux (x86_64) and Windows (x86_64) using `bun build --compile`. The output binaries must be placed in the Tauri binaries directory with the correct target-triple naming convention so Tauri can discover them as a sidecar.

Also add the compiled binaries to `.gitignore` — they are build artifacts, not source.

See the "Server Build Script" module in the PRD's Implementation Decisions section.

## Acceptance criteria

- [ ] Running the build script produces a Linux binary at `apps/desktop/src-tauri/binaries/server-x86_64-unknown-linux-gnu`
- [ ] Running the build script produces a Windows binary at `apps/desktop/src-tauri/binaries/server-x86_64-pc-windows-msvc.exe`
- [ ] The binaries, when executed directly, start the server and respond to `GET /health` with `{ ok: true }`
- [ ] The `apps/desktop/src-tauri/binaries/` directory (or its contents) is listed in `.gitignore`
- [ ] The script is available as a `pnpm` script (e.g., `build:sidecar`) in the server or desktop package

## Blocked by

None — can start immediately.

## User stories addressed

- User story #8 (build pipeline automation)
- User story #9 (cross-compile from single machine)
