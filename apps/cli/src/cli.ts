import { resolve } from "node:path";
import {
  PercentageChangeDetector,
  ThresholdDetector,
  WindowedChangeDetector,
} from "@signal-hub/analysis";
import { CoinGeckoConnector } from "@signal-hub/connector-coingecko";
import { CsvConnector } from "@signal-hub/connector-csv";
import { GitHubConnector } from "@signal-hub/connector-github";
import { formatSignals, runPipeline } from "@signal-hub/core";
import { SqliteStorage } from "@signal-hub/storage";
import type { Connector, Detector } from "@signal-hub/types";
import { parseCliArgs, type ParsedCliCommand } from "./arguments.js";

export interface CliEnvironment {
  GITHUB_TOKEN?: string;
  COINGECKO_DEMO_API_KEY?: string;
}

export async function runCli(
  args: string[],
  environment: CliEnvironment = process.env,
): Promise<string> {
  const command = parseCliArgs(args);
  const connector = createConnector(command, environment);
  const detectors = createDetectors(command);
  const storage = new SqliteStorage(resolve(process.cwd(), "data.db"));

  try {
    const signals = await runPipeline(connector, storage, {
      detectors,
      minScore: command.minScore,
    });
    return formatSignals(signals);
  } finally {
    storage.close();
  }
}

function createConnector(command: ParsedCliCommand, environment: CliEnvironment): Connector {
  if (command.source === "csv") {
    return new CsvConnector(resolve(process.cwd(), command.filePath));
  }
  if (command.source === "github") {
    return new GitHubConnector({
      owner: command.owner,
      repo: command.repo,
      token: optionalCredential(environment.GITHUB_TOKEN),
    });
  }
  return new CoinGeckoConnector({
    coinId: command.coinId,
    vsCurrency: command.vsCurrency,
    historyDays: command.historyDays,
    apiKey: optionalCredential(environment.COINGECKO_DEMO_API_KEY),
  });
}

function createDetectors(command: ParsedCliCommand): Detector[] {
  const detectors: Detector[] = [new PercentageChangeDetector()];
  if (command.threshold !== undefined) {
    detectors.push(new ThresholdDetector(command.threshold));
  }
  if (command.windowMs !== undefined) {
    detectors.push(new WindowedChangeDetector(command.windowMs));
  }
  return detectors;
}

function optionalCredential(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}
