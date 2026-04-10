## Parent PRD

[docs/prd-self-contained-desktop.md](../prd-self-contained-desktop.md)

## What to build

Integrate the sidecar build step into the Tauri build pipeline so that the correct server binaries are always compiled before `tauri build` runs. Update `beforeBuildCommand` in `tauri.conf.json` to include the sidecar build script ahead of the existing frontend build. After this change, a single `tauri build` command produces a fully self-contained installer with no extra manual steps.

Also verify that `pnpm dev` (which runs the server via `tsx watch`) continues to work unchanged for local development — the sidecar path must only activate in production builds.

See the "Build Pipeline Integration" slice and the "Further Notes" section of the PRD.

## Acceptance criteria

- [ ] Running `tauri build` (with no prior manual steps) produces an installer that includes the sidecar binary
- [ ] The sidecar binary in the installer is up-to-date with the current server source
- [ ] `pnpm dev` still starts the server via `tsx watch` as before (dev workflow unchanged)
- [ ] A fresh checkout with Bun and Rust/Tauri toolchain installed can produce a working build without extra instructions
- [ ] CI documentation or a README note lists Bun as a required build-time dependency

## Blocked by

- Blocked by `02-tauri-sidecar-registration-and-spawn.md`

## User stories addressed

- User story #1 (install once, no setup)
- User story #8 (build pipeline automation)
