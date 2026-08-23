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

  it("does not persist duplicate signals when the same input is processed twice", async () => {
    const storage = new SqliteStorage(":memory:");
    const connector = fakeConnector([
      { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
      { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 150 },
    ]);

    await runPipeline(connector, storage, { detectors: [new PercentageChangeDetector()] });
    await runPipeline(connector, storage, { detectors: [new PercentageChangeDetector()] });

    expect(storage.signals.getAll()).toHaveLength(1);
    storage.close();
  });

  it("refreshes fetched snapshots when explicitly requested", async () => {
    const storage = new SqliteStorage(":memory:");
    const timestamp = "2026-07-27T00:00:00.000Z";

    await runPipeline(
      fakeConnector([{ metricId: "m1", timestamp, value: 1 }]),
      storage,
      { detectors: [new PercentageChangeDetector()] },
    );
    await runPipeline(
      fakeConnector([{ metricId: "m1", timestamp, value: 2 }]),
      storage,
      { detectors: [new PercentageChangeDetector()], refreshDataPoints: true },
    );

    expect(storage.dataPoints.getByMetric("m1")).toEqual([
      { metricId: "m1", timestamp, value: 2 },
    ]);
    storage.close();
  });

  it("limits detection to the current fetch when explicitly requested", async () => {
    const storage = new SqliteStorage(":memory:");
    storage.dataPoints.insertMany([
      { metricId: "m1", timestamp: "2026-07-01T00:00:00.000Z", value: 50 },
      { metricId: "m1", timestamp: "2026-07-02T00:00:00.000Z", value: 100 },
    ]);

    const signals = await runPipeline(
      fakeConnector([
        { metricId: "m1", timestamp: "2026-08-02T00:00:00.000Z", value: 125 },
        { metricId: "m1", timestamp: "2026-08-01T00:00:00.000Z", value: 100 },
      ]),
      storage,
      { detectors: [new PercentageChangeDetector()], analyzeFetchedOnly: true },
    );

    expect(signals).toEqual([
      expect.objectContaining({
        timestamp: "2026-08-02T00:00:00.000Z",
        changePercent: 25,
      }),
    ]);
    storage.close();
  });

  it("isolates persisted points and signals when a namespace is provided", async () => {
    const storage = new SqliteStorage(":memory:");
    const metricId = "github:octocat/Hello-World:commits";
    storage.dataPoints.insertMany([
      { metricId, timestamp: "2026-08-01T00:00:00.000Z", value: 100 },
      { metricId, timestamp: "2026-08-02T00:00:00.000Z", value: 200 },
    ]);

    await runPipeline(
      fakeConnector([
        { metricId, timestamp: "2026-08-01T00:00:00.000Z", value: 1 },
        { metricId, timestamp: "2026-08-02T00:00:00.000Z", value: 2 },
      ]),
      storage,
      {
        detectors: [new PercentageChangeDetector()],
        refreshDataPoints: true,
        analyzeFetchedOnly: true,
        persistenceNamespace: "github",
      },
    );

    expect(storage.dataPoints.getByMetric(metricId).map((point) => point.value)).toEqual([
      100,
      200,
    ]);
    expect(
      storage.dataPoints.getByMetric(metricId, "github").map((point) => point.value),
    ).toEqual([1, 2]);
    expect(storage.signals.getAll()).toEqual([]);
    expect(storage.signals.getAll("github")).toEqual([
      expect.objectContaining({ metricId, value: 2, changePercent: 100 }),
    ]);
    storage.close();
  });
});
