import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CsvConnector } from "../src/CsvConnector.js";

describe("CsvConnector", () => {
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "signal-hub-csv-"));
  });

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true });
  });

  function writeCsv(contents: string): string {
    const filePath = join(directory, "data.csv");
    writeFileSync(filePath, contents, "utf-8");
    return filePath;
  }

  it("parses valid rows into DataPoints with ISO timestamps", async () => {
    const points = await new CsvConnector(
      writeCsv(
        "metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,42\nm2,2026-07-27T01:00:00Z,7\n",
      ),
    ).fetch();

    expect(points).toEqual([
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 42 },
      { metricId: "m2", timestamp: "2026-07-27T01:00:00.000Z", value: 7 },
    ]);
  });

  it("throws on a malformed header", async () => {
    await expect(
      new CsvConnector(writeCsv("id,time,val\nm1,2026-07-27T00:00:00Z,42\n")).fetch(),
    ).rejects.toThrow(/Invalid CSV header/);
  });

  it("throws on a row with the wrong number of columns", async () => {
    await expect(
      new CsvConnector(writeCsv("metricId,timestamp,value\nm1,2026-07-27T00:00:00Z\n")).fetch(),
    ).rejects.toThrow(/line 2/);
  });

  it("throws on a row with an invalid timestamp", async () => {
    await expect(
      new CsvConnector(writeCsv("metricId,timestamp,value\nm1,not-a-date,42\n")).fetch(),
    ).rejects.toThrow(/line 2/);
  });

  it("throws on a row with a non-numeric value", async () => {
    await expect(
      new CsvConnector(
        writeCsv("metricId,timestamp,value\nm1,2026-07-27T00:00:00Z,not-a-number\n"),
      ).fetch(),
    ).rejects.toThrow(/line 2/);
  });

  it("throws on an empty file", async () => {
    await expect(new CsvConnector(writeCsv("")).fetch()).rejects.toThrow(/empty/);
  });
});
