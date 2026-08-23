import { scoreSignals } from "@signal-hub/analysis";
import { isValidDataPoint } from "@signal-hub/connector-sdk";
import type { SqliteStorage } from "@signal-hub/storage";
import type { Connector, Detector, Signal } from "@signal-hub/types";

export interface PipelineOptions {
  detectors: Detector[];
  minScore?: number;
  refreshDataPoints?: boolean;
  analyzeFetchedOnly?: boolean;
}

export async function runPipeline(
  connector: Connector,
  storage: SqliteStorage,
  options: PipelineOptions,
): Promise<Signal[]> {
  const minScore = options.minScore ?? 0;
  const rawPoints = await connector.fetch();
  const validPoints = rawPoints.filter(isValidDataPoint);
  if (options.refreshDataPoints) {
    storage.dataPoints.replaceMany(validPoints);
  } else {
    storage.dataPoints.insertMany(validPoints);
  }

  const metricIds = [...new Set(validPoints.map((point) => point.metricId))];
  const rawSignals: Signal[] = [];
  for (const metricId of metricIds) {
    const series = options.analyzeFetchedOnly
      ? validPoints
          .filter((point) => point.metricId === metricId)
          .sort((first, second) => first.timestamp.localeCompare(second.timestamp))
      : storage.dataPoints.getByMetric(metricId);
    for (const detector of options.detectors) {
      rawSignals.push(...detector.detect(series));
    }
  }

  const scoredSignals = scoreSignals(rawSignals)
    .filter((signal) => signal.score >= minScore)
    .sort((first, second) => second.score - first.score);

  storage.signals.insertMany(scoredSignals);
  return scoredSignals;
}
