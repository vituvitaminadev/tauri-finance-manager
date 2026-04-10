## Parent PRD

[docs/prd-self-contained-desktop.md](../prd-self-contained-desktop.md)

## What to build

Expose a Tauri command `wait_for_server` that the frontend can invoke to synchronize with the server startup. The command polls `GET http://localhost:3001/health` in a loop with a short delay until the server responds successfully, then returns. This is the bridge between the Rust sidecar lifecycle and the React UI.

See the "Rust App Core" module and the "Testing Decisions" section of the PRD.

## Acceptance criteria

- [ ] A Tauri command `wait_for_server` is registered and callable from the frontend via `@tauri-apps/api/core`
- [ ] The command resolves successfully once the server's `/health` endpoint returns `{ ok: true }`
- [ ] The command does not resolve while the server is not yet responding
- [ ] The command has a reasonable timeout (e.g., 30 seconds) and returns an error if the server never starts
- [ ] Tests verify: resolves when healthy, keeps polling while not yet up, errors on timeout

## Blocked by

- Blocked by `02-tauri-sidecar-registration-and-spawn.md`

## User stories addressed

- User story #2 (app starts fully on its own)
- User story #4 (loading indicator while starting)
