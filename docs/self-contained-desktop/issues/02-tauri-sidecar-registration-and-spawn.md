## Parent PRD

[docs/prd-self-contained-desktop.md](../prd-self-contained-desktop.md)

## What to build

Register the server binary as a Tauri sidecar and wire up the Rust side to spawn it automatically when the app starts. When the app window closes, Tauri kills the process automatically via the shell plugin's child process handle.

This covers the full lifecycle: app open → server spawns → app close → server dies. No manual terminal required.

See the "Tauri Configuration" and "Rust App Core" modules in the PRD's Implementation Decisions section.

## Acceptance criteria

- [ ] `tauri-plugin-shell` is added as a Rust dependency and initialized in the Tauri builder
- [ ] The server binary is declared as an external binary (sidecar) in `tauri.conf.json` for both Linux and Windows target triples
- [ ] The Tauri capabilities config grants `shell:allow-execute` and `shell:allow-kill` for the sidecar
- [ ] On app startup, the sidecar process is spawned automatically (no user action required)
- [ ] After app startup, `GET http://localhost:3001/health` returns `{ ok: true }`
- [ ] When the app window is closed, the server process is no longer running
- [ ] No server process leaks if the app crashes or is force-killed

## Blocked by

- Blocked by `01-server-sidecar-build-script.md`

## User stories addressed

- User story #2 (app starts fully on its own)
- User story #3 (server stops when app closes)
- User story #5 (works on Linux)
- User story #6 (works on Windows)
