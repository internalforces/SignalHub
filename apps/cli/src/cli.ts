import { resolve } from "node:path";
import { PercentageChangeDetector, ThresholdDetector } from "@signal-hub/analysis";
import { CsvConnector } from "@signal-hub/connector-csv";
import { formatSignals, runPipeline } from "@signal-hub/core";
import { SqliteStorage } from "@signal-hub/storage";
import type { Detector } from "@signal-hub/types";

const USAGE = "Usage: signal-hub analyze <file.csv> [--min-score <n>] [--threshold <n>]";

export async function runCli(args: string[]): Promise<string> {
  const [command, filePath, ...rest] = args;
  if (command !== "analyze" || !filePath) {
    throw new Error(USAGE);
  }

  let minScore: number | undefined;
  let threshold: number | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--min-score") {
      minScore = Number(rest[index + 1]);
      index += 1;
    }
    if (rest[index] === "--threshold") {
      threshold = Number(rest[index + 1]);
      index += 1;
    }
  }

  const storage = new SqliteStorage(resolve(process.cwd(), "data.db"));
  try {
    const connector = new CsvConnector(resolve(process.cwd(), filePath));
    const detectors: Detector[] = [new PercentageChangeDetector()];
    if (threshold !== undefined) {
      detectors.push(new ThresholdDetector(threshold));
    }

    const signals = await runPipeline(connector, storage, { detectors, minScore });
    return formatSignals(signals);
  } finally {
    storage.close();
  }
}
