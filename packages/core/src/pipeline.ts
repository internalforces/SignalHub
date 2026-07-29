import { scoreSignals } from "@signal-hub/analysis";
import { isValidDataPoint } from "@signal-hub/connector-sdk";
import type { SqliteStorage } from "@signal-hub/storage";
import type { Connector, Detector, Signal } from "@signal-hub/types";

export interface PipelineOptions {
  detectors: Detector[];
  minScore?: number;
}

export async function runPipeline(
  connector: Connector,
  storage: SqliteStorage,
  options: PipelineOptions,
): Promise<Signal[]> {
  const minScore = options.minScore ?? 0;
  const rawPoints = await connector.fetch();
  const validPoints = rawPoints.filter(isValidDataPoint);
  storage.dataPoints.insertMany(validPoints);

  const metricIds = [...new Set(validPoints.map((point) => point.metricId))];
  const rawSignals: Signal[] = [];
  for (const metricId of metricIds) {
    const series = storage.dataPoints.getByMetric(metricId);
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
