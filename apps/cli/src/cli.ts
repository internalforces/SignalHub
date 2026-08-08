import { resolve } from "node:path";
import {
  PercentageChangeDetector,
  ThresholdDetector,
  WindowedChangeDetector,
} from "@signal-hub/analysis";
import { CsvConnector } from "@signal-hub/connector-csv";
import { formatSignals, runPipeline } from "@signal-hub/core";
import { SqliteStorage } from "@signal-hub/storage";
import type { Detector } from "@signal-hub/types";

const HOUR_MS = 60 * 60 * 1000;
const USAGE =
  "Usage: csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]";

export async function runCli(args: string[]): Promise<string> {
  const [command, filePath, ...rest] = args;
  if (command !== "analyze" || !filePath || filePath.startsWith("--")) {
    throw new Error(USAGE);
  }

  let minScore: number | undefined;
  let threshold: number | undefined;
  let windowMs: number | undefined;
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const rawValue = rest[index + 1];
    if (
      (flag !== "--min-score" && flag !== "--threshold" && flag !== "--window-hours") ||
      rawValue === undefined
    ) {
      throw new Error(USAGE);
    }

    const value = Number(rawValue);
    if (rawValue.trim().length === 0 || !Number.isFinite(value)) {
      throw new Error(USAGE);
    }

    if (flag === "--window-hours") {
      const durationMs = value * HOUR_MS;
      if (durationMs <= 0 || !Number.isFinite(durationMs)) {
        throw new Error(USAGE);
      }
      windowMs = durationMs;
    } else if (flag === "--min-score") {
      minScore = value;
    } else {
      threshold = value;
    }
  }

  const storage = new SqliteStorage(resolve(process.cwd(), "data.db"));
  try {
    const connector = new CsvConnector(resolve(process.cwd(), filePath));
    const detectors: Detector[] = [new PercentageChangeDetector()];
    if (threshold !== undefined) {
      detectors.push(new ThresholdDetector(threshold));
    }
    if (windowMs !== undefined) {
      detectors.push(new WindowedChangeDetector(windowMs));
    }

    const signals = await runPipeline(connector, storage, { detectors, minScore });
    return formatSignals(signals);
  } finally {
    storage.close();
  }
}
