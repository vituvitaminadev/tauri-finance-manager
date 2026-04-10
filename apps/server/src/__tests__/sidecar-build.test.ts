import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { join } from "path";

const BINARIES_DIR = join(
  __dirname,
  "../../../desktop/src-tauri/binaries"
);

describe("sidecar build", () => {
  it("linux binary exists at the Tauri sidecar path", () => {
    const binaryPath = join(
      BINARIES_DIR,
      "server-x86_64-unknown-linux-gnu"
    );
    expect(existsSync(binaryPath)).toBe(true);
  });

  it("windows binary exists at the Tauri sidecar path", () => {
    const binaryPath = join(
      BINARIES_DIR,
      "server-x86_64-pc-windows-msvc.exe"
    );
    expect(existsSync(binaryPath)).toBe(true);
  });
});
