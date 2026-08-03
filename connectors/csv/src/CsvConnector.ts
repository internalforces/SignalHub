import { readFile } from "node:fs/promises";
import type { Connector, DataPoint } from "@signal-hub/connector-sdk";

const EXPECTED_HEADER = ["metricid", "timestamp", "value"];

export class CsvConnector implements Connector {
  readonly id = "csv";

  constructor(private readonly filePath: string) {}

  async fetch(): Promise<DataPoint[]> {
    const raw = await readFile(this.filePath, "utf-8");
    const lines = raw
      .split(/\r?\n/)
      .map((line, index) => ({ line, lineNumber: index + 1 }))
      .filter(({ line }) => line.trim().length > 0);

    if (lines.length === 0) {
      throw new Error(`CSV file is empty: ${this.filePath}`);
    }

    const header = lines[0].line.split(",").map((column) => column.trim().toLowerCase());
    if (
      header.length !== 3 ||
      !EXPECTED_HEADER.every((column, index) => header[index] === column)
    ) {
      throw new Error(
        `Invalid CSV header. Expected "metricId,timestamp,value", got "${lines[0].line}"`,
      );
    }

    const points: DataPoint[] = [];
    for (let index = 1; index < lines.length; index += 1) {
      const { line, lineNumber } = lines[index];
      const columns = line.split(",");
      if (columns.length !== 3) {
        throw new Error(
          `Invalid row at line ${lineNumber}: expected 3 columns, got ${columns.length}`,
        );
      }

      const [metricId, timestamp, rawValue] = columns.map((column) => column.trim());
      if (!metricId) {
        throw new Error(`Invalid row at line ${lineNumber}: missing metricId`);
      }
      if (Number.isNaN(Date.parse(timestamp))) {
        throw new Error(`Invalid row at line ${lineNumber}: invalid timestamp "${timestamp}"`);
      }

      const value = Number(rawValue);
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid row at line ${lineNumber}: invalid value "${rawValue}"`);
      }

      points.push({
        metricId,
        timestamp: new Date(timestamp).toISOString(),
        value,
      });
    }

    return points;
  }
}
