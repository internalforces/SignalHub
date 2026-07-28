import { describe, expect, it } from "vitest";
import { PercentageChangeDetector, ThresholdDetector } from "@signal-hub/analysis";
import { SqliteStorage } from "@signal-hub/storage";
import type { Connector, DataPoint } from "@signal-hub/types";
import { runPipeline } from "../src/pipeline.js";

function fakeConnector(points: DataPoint[]): Connector {
  return { id: "fake", fetch: async () => points };
}

describe("runPipeline", () => {
  it("produces scored signals sorted descending", async () => {
    const storage = new SqliteStorage(":memory:");
    const signals = await runPipeline(
      fakeConnector([
        { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
        { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 105 },
        { metricId: "m1", timestamp: "2026-07-27T02:00:00.000Z", value: 150 },
      ]),
      storage,
      { detectors: [new PercentageChangeDetector()] },
    );
    storage.close();

    expect(signals.length).toBeGreaterThan(0);
    for (let index = 1; index < signals.length; index += 1) {
      expect(signals[index - 1].score).toBeGreaterThanOrEqual(signals[index].score);
    }
  });

  it("filters signals below minScore", async () => {
    const storage = new SqliteStorage(":memory:");
    const signals = await runPipeline(
      fakeConnector([
        { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
        { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 101 },
      ]),
      storage,
      { detectors: [new PercentageChangeDetector()], minScore: 90 },
    );
    storage.close();

    expect(signals).toHaveLength(0);
  });

  it("runs multiple detectors and multiple metrics independently", async () => {
    const storage = new SqliteStorage(":memory:");
    const signals = await runPipeline(
      fakeConnector([
        { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 10 },
        { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 200 },
        { metricId: "m2", timestamp: "2026-07-27T00:00:00.000Z", value: 5 },
      ]),
      storage,
      { detectors: [new PercentageChangeDetector(), new ThresholdDetector(100)] },
    );
    storage.close();

    expect(signals.some((signal) => signal.metricId === "m1" && signal.type === "threshold")).toBe(true);
    expect(signals.some((signal) => signal.metricId === "m1" && signal.type === "increase")).toBe(true);
    expect(signals.every((signal) => signal.metricId !== "m2" || signal.type !== "threshold")).toBe(true);
  });

  it("drops invalid points before storing", async () => {
    const storage = new SqliteStorage(":memory:");
    await runPipeline(
      fakeConnector([
        { metricId: "", timestamp: "2026-07-27T00:00:00.000Z", value: 10 },
        { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 10 },
      ]),
      storage,
      { detectors: [new PercentageChangeDetector()] },
    );
    const stored = storage.dataPoints.getByMetric("m1");
    storage.close();

    expect(stored).toHaveLength(1);
  });
});
