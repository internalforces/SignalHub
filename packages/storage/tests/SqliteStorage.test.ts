import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DataPoint, Signal } from "@signal-hub/types";
import { SqliteStorage } from "../src/SqliteStorage.js";

describe("SqliteStorage", () => {
  let storage: SqliteStorage;

  beforeEach(() => {
    storage = new SqliteStorage(":memory:");
  });

  afterEach(() => {
    storage.close();
  });

  it("inserts and retrieves data points ordered by timestamp", () => {
    const points: DataPoint[] = [
      { metricId: "m1", timestamp: "2026-07-27T02:00:00.000Z", value: 2 },
      { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 1 },
    ];

    storage.dataPoints.insertMany(points);

    expect(storage.dataPoints.getByMetric("m1").map((point) => point.value)).toEqual([
      1,
      2,
    ]);
  });

  it("deduplicates data points with the same metricId and timestamp", () => {
    const point: DataPoint = {
      metricId: "m1",
      timestamp: "2026-07-27T01:00:00.000Z",
      value: 1,
    };
    storage.dataPoints.insertMany([point]);
    storage.dataPoints.insertMany([{ ...point, value: 999 }]);

    const result = storage.dataPoints.getByMetric("m1");
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(1);
  });

  it("replaces an existing data point only when explicitly requested", () => {
    const point: DataPoint = {
      metricId: "m1",
      timestamp: "2026-07-27T01:00:00.000Z",
      value: 1,
    };
    storage.dataPoints.insertMany([point]);
    storage.dataPoints.replaceMany([{ ...point, value: 2 }]);

    expect(storage.dataPoints.getByMetric("m1")).toEqual([{ ...point, value: 2 }]);
  });

  it("isolates matching data points by persistence namespace", () => {
    const point: DataPoint = {
      metricId: "github:octocat/Hello-World:commits",
      timestamp: "2026-08-01T00:00:00.000Z",
      value: 100,
    };
    storage.dataPoints.insertMany([point]);
    storage.dataPoints.replaceMany([{ ...point, value: 2 }], "github");

    expect(storage.dataPoints.getByMetric(point.metricId)).toEqual([point]);
    expect(storage.dataPoints.getByMetric(point.metricId, "github")).toEqual([
      { ...point, value: 2 },
    ]);
  });

  it("returns an empty array for an unknown metric", () => {
    expect(storage.dataPoints.getByMetric("unknown")).toEqual([]);
  });

  it("inserts and retrieves signals ordered by score descending", () => {
    const signals: Signal[] = [
      {
        id: "s1",
        metricId: "m1",
        type: "increase",
        score: 40,
        direction: "up",
        timestamp: "t1",
        value: 1,
        changePercent: 10,
      },
      {
        id: "s2",
        metricId: "m1",
        type: "increase",
        score: 90,
        direction: "up",
        timestamp: "t2",
        value: 2,
        changePercent: 20,
      },
    ];

    storage.signals.insertMany(signals);

    expect(storage.signals.getAll().map((signal) => signal.id)).toEqual(["s2", "s1"]);
  });

  it("isolates matching signals by persistence namespace", () => {
    const signal: Signal = {
      id: "same-id",
      metricId: "github:octocat/Hello-World:commits",
      type: "increase",
      score: 100,
      direction: "up",
      timestamp: "2026-08-02T00:00:00.000Z",
      value: 200,
      changePercent: 100,
    };
    storage.signals.insertMany([signal]);
    storage.signals.insertMany([{ ...signal, value: 2 }], "github");

    expect(storage.signals.getAll()).toEqual([signal]);
    expect(storage.signals.getAll("github")).toEqual([{ ...signal, value: 2 }]);
  });
});
