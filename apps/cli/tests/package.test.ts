import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface PackEntry {
  files: Array<{ path: string }>;
}

interface PackageManifest {
  name: string;
  version: string;
  private?: boolean;
  license?: string;
  engines?: { node?: string };
  files?: string[];
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const cliDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  readFileSync(resolve(cliDirectory, "package.json"), "utf-8"),
) as PackageManifest;

describe("CLI release package", () => {
  it("has approved release metadata and no workspace runtime dependency", () => {
    expect(manifest).toMatchObject({
      name: "csv-to-signal",
      version: "0.3.0",
      license: "Apache-2.0",
      engines: { node: "^20.0.0 || ^22.0.0 || >=24.0.0" },
      files: ["dist/index.js", "README.md", "LICENSE"],
      dependencies: { "better-sqlite3": "^11.3.0" },
      bin: { "csv-to-signal": "./dist/index.js" },
    });
    expect(manifest.private).not.toBe(true);
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(["better-sqlite3"]);

    const allVersions = [
      ...Object.values(manifest.dependencies ?? {}),
      ...Object.values(manifest.devDependencies ?? {}),
    ];
    expect(allVersions.some((version) => version.startsWith("workspace:"))).toBe(false);
  });

  it("packs only the approved runtime and documentation files", () => {
    const output = execFileSync(
      "npm",
      ["pack", "--dry-run", "--json", "--ignore-scripts"],
      { cwd: cliDirectory, encoding: "utf-8" },
    );
    const [pack] = JSON.parse(output) as PackEntry[];
    expect(pack.files.map((file) => file.path).sort()).toEqual([
      "LICENSE",
      "README.md",
      "dist/index.js",
      "package.json",
    ]);
  });

  it("builds a standalone executable without private workspace imports", () => {
    const executable = readFileSync(resolve(cliDirectory, "dist/index.js"), "utf-8");
    expect(executable.startsWith("#!/usr/bin/env node\n")).toBe(true);
    expect(executable).not.toContain("@signal-hub/");
  });
});
