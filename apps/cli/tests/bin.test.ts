import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliPath = new URL("../dist/index.js", import.meta.url);

describe("signal-hub executable", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "signal-hub-cli-bin-"));
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
      [cliPath.pathname, "analyze", "data.csv"],
      { cwd: directory },
    );

    expect(stderr).toBe("");
    expect(JSON.parse(stdout)).toHaveLength(1);
  });
});
