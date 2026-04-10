import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "../../../..");

describe("build pipeline integration", () => {
  it("root package.json has a build:sidecar script", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
    expect(pkg.scripts["build:sidecar"]).toBeDefined();
  });

  it("tauri.conf.json beforeBuildCommand includes sidecar build", () => {
    const conf = JSON.parse(
      readFileSync(
        join(ROOT, "apps/desktop/src-tauri/tauri.conf.json"),
        "utf-8"
      )
    );
    expect(conf.build.beforeBuildCommand).toContain("build:sidecar");
  });

  it("tauri.conf.json beforeBuildCommand still builds the frontend", () => {
    const conf = JSON.parse(
      readFileSync(
        join(ROOT, "apps/desktop/src-tauri/tauri.conf.json"),
        "utf-8"
      )
    );
    expect(conf.build.beforeBuildCommand).toContain("pnpm build");
  });

  it("tauri.conf.json beforeDevCommand is unchanged", () => {
    const conf = JSON.parse(
      readFileSync(
        join(ROOT, "apps/desktop/src-tauri/tauri.conf.json"),
        "utf-8"
      )
    );
    expect(conf.build.beforeDevCommand).toBe("pnpm dev");
  });
});
