import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ServerReadyGate } from "./ServerReadyGate";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ServerReadyGate", () => {
  it("shows loading indicator while wait_for_server is pending", () => {
    mockInvoke.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <ServerReadyGate>
        <div>App Content</div>
      </ServerReadyGate>
    );
    expect(screen.getByText(/starting/i)).toBeDefined();
    expect(screen.queryByText("App Content")).toBeNull();
  });

  it("renders children once wait_for_server resolves", async () => {
    mockInvoke.mockResolvedValue(undefined);
    render(
      <ServerReadyGate>
        <div>App Content</div>
      </ServerReadyGate>
    );
    await waitFor(() => expect(screen.getByText("App Content")).toBeDefined());
    expect(screen.queryByText(/starting/i)).toBeNull();
  });

  it("shows error message when wait_for_server rejects", async () => {
    mockInvoke.mockRejectedValue("Server did not start in time");
    render(
      <ServerReadyGate>
        <div>App Content</div>
      </ServerReadyGate>
    );
    await waitFor(() =>
      expect(screen.getByText(/failed to start server/i)).toBeDefined()
    );
    expect(screen.queryByText("App Content")).toBeNull();
  });
});
