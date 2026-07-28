import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";

describe("runCli", () => {
  let directory: string;
  let originalCwd: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "signal-hub-cli-"));
    originalCwd = process.cwd();
    process.chdir(directory);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(directory, { recursive: true, force: true });
  });

  function writeCsv(...lines: string[]): void {
    writeFileSync(join(directory, "data.csv"), `${lines.join("\n")}\n`, "utf-8");
  }

  it("analyzes a CSV file and prints ranked JSON signals", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-07-27T00:00:00Z,100",
      "m1,2026-07-27T01:00:00Z,150",
      "m1,2026-07-27T02:00:00Z,151",
    );

    const signals = JSON.parse(await runCli(["analyze", "data.csv"]));

    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toHaveProperty("score");
    expect(signals[0].metricId).toBe("m1");
  });

  it("applies --min-score to filter output", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-07-27T00:00:00Z,100",
      "m1,2026-07-27T01:00:00Z,101",
    );

    expect(JSON.parse(await runCli(["analyze", "data.csv", "--min-score", "90"]))).toEqual([]);
  });

  it("includes threshold signals when --threshold is passed", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-07-27T00:00:00Z,10",
      "m1,2026-07-27T01:00:00Z,200",
    );

    const signals = JSON.parse(
      await runCli(["analyze", "data.csv", "--threshold", "100"]),
    );
    expect(signals.some((signal: { type: string }) => signal.type === "threshold")).toBe(true);
  });

  it("throws a usage error when the file argument is missing", async () => {
    await expect(runCli(["analyze"])).rejects.toThrow(/Usage/);
  });

  it("throws a usage error for an unknown command", async () => {
    await expect(runCli(["bogus", "data.csv"])).rejects.toThrow(/Usage/);
  });
});
