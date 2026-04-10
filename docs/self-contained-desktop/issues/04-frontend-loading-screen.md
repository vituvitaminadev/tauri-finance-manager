## Parent PRD

[docs/prd-self-contained-desktop.md](../prd-self-contained-desktop.md)

## What to build

Add a loading screen to the React app that is shown while the server is starting up. On mount, the app calls the `wait_for_server` Tauri command. Until it resolves, a centered loading indicator (spinner + "Starting…" message) is rendered instead of the normal app content. Once resolved, the full app renders normally.

This component wraps the root of the React tree so no page or route renders before the server is ready — eliminating any possibility of the user seeing tRPC connection errors on startup.

See the "Frontend Loading Screen" module and "Testing Decisions" in the PRD.

## Acceptance criteria

- [ ] A loading indicator is displayed immediately when the app opens
- [ ] The loading indicator disappears and the normal app renders once `wait_for_server` resolves
- [ ] No tRPC request is made before `wait_for_server` has resolved
- [ ] If `wait_for_server` returns an error, an error message is shown (not a blank screen or crash)
- [ ] Tests verify: loading UI shown while pending, app content shown after resolve, error state shown on failure

## Blocked by

- Blocked by `03-wait-for-server-tauri-command.md`

## User stories addressed

- User story #4 (loading indicator while starting)
- User story #2 (app starts fully on its own)
