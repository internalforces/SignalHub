import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliPath = new URL("../dist/index.js", import.meta.url);

describe("csv-to-signal executable", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "csv-to-signal-cli-bin-"));
    writeFileSync(
      join(directory, "data.csv"),
      "metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,100\nm1,2026-07-27T01:00:00Z,150\n",
      "utf-8",
    );
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  it("runs the built CLI against a CSV file", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [fileURLToPath(cliPath), "analyze", "data.csv"],
      { cwd: directory },
    );

    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toHaveLength(1);
  });

  it("runs windowed analysis from the built CLI", async () => {
    writeFileSync(
      join(directory, "data.csv"),
      "metricId,timestamp,value\nm1,2026-08-01T23:00:00Z,100\nm1,2026-08-02T12:00:00Z,110\nm1,2026-08-03T00:00:00Z,150\n",
      "utf-8",
    );

    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      [fileURLToPath(cliPath), "analyze", "data.csv", "--window-hours", "24"],
      { cwd: directory },
    );
    const signals = JSON.parse(stdout) as Array<{ id: string; changePercent: number }>;
    const windowed = signals.find((signal) => JSON.parse(signal.id)[0] === "windowed-change");

    expect(stderr).toBe("");
    expect(windowed?.changePercent).toBe(50);
  });
});
