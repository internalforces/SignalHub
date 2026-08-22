const HOUR_MS = 60 * 60 * 1000;
const COMMON_FLAGS = ["--min-score", "--threshold", "--window-hours"] as const;

export const USAGE = [
  "Usage:",
  "  csv-to-signal analyze <file.csv> [--min-score <n>] [--threshold <n>] [--window-hours <n>]",
  "  csv-to-signal github <owner>/<repo> [--min-score <n>] [--threshold <n>] [--window-hours <n>]",
  "  csv-to-signal coingecko <coin-id> [--vs-currency <currency>] [--days <n>] [--min-score <n>] [--threshold <n>] [--window-hours <n>]",
].join("\n");

interface DetectorOptions {
  minScore: number | undefined;
  threshold: number | undefined;
  windowMs: number | undefined;
}

export type ParsedCliCommand =
  | ({ source: "csv"; filePath: string } & DetectorOptions)
  | ({ source: "github"; owner: string; repo: string } & DetectorOptions)
  | ({
      source: "coingecko";
      coinId: string;
      vsCurrency: string;
      historyDays: number;
    } & DetectorOptions);

export function parseCliArgs(args: string[]): ParsedCliCommand {
  const [command, rawInput, ...rest] = args;
  const input = rawInput?.trim();
  if (!command || !input || input.startsWith("--")) {
    throw new Error(USAGE);
  }

  const allowedFlags = new Set<string>(COMMON_FLAGS);
  if (command === "coingecko") {
    allowedFlags.add("--vs-currency");
    allowedFlags.add("--days");
  } else if (command !== "analyze" && command !== "github") {
    throw new Error(USAGE);
  }

  const values = readFlagValues(rest, allowedFlags);
  const detectorOptions: DetectorOptions = {
    minScore: readFiniteNumber(values.get("--min-score")),
    threshold: readFiniteNumber(values.get("--threshold")),
    windowMs: readWindowMs(values.get("--window-hours")),
  };

  if (command === "analyze") {
    return { source: "csv", filePath: input, ...detectorOptions };
  }

  if (command === "github") {
    const segments = input.split("/").map((segment) => segment.trim());
    if (segments.length !== 2 || segments.some((segment) => segment.length === 0)) {
      throw new Error(USAGE);
    }
    return { source: "github", owner: segments[0], repo: segments[1], ...detectorOptions };
  }

  const vsCurrency = (values.get("--vs-currency") ?? "usd").trim();
  const rawDays = values.get("--days") ?? "30";
  const historyDays = Number(rawDays);
  if (!vsCurrency || !Number.isInteger(historyDays) || historyDays <= 0) {
    throw new Error(USAGE);
  }

  return {
    source: "coingecko",
    coinId: input,
    vsCurrency,
    historyDays,
    ...detectorOptions,
  };
}

function readFlagValues(args: string[], allowedFlags: ReadonlySet<string>): Map<string, string> {
  if (args.length % 2 !== 0) {
    throw new Error(USAGE);
  }

  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const rawValue = args[index + 1];
    if (!allowedFlags.has(flag) || !rawValue || rawValue.trim().length === 0 || rawValue.startsWith("--")) {
      throw new Error(USAGE);
    }
    values.set(flag, rawValue);
  }
  return values;
}

function readFiniteNumber(rawValue: string | undefined): number | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  const value = Number(rawValue);
  if (!Number.isFinite(value)) {
    throw new Error(USAGE);
  }
  return value;
}

function readWindowMs(rawValue: string | undefined): number | undefined {
  const hours = readFiniteNumber(rawValue);
  if (hours === undefined) {
    return undefined;
  }
  const windowMs = hours * HOUR_MS;
  if (windowMs <= 0 || !Number.isFinite(windowMs)) {
    throw new Error(USAGE);
  }
  return windowMs;
}
