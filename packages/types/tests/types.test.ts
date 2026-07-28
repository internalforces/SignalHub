import { describe, expect, it } from "vitest";
import type { Connector, DataPoint, Detector, Signal } from "../src/index.js";

describe("types", () => {
  it("accepts a well-formed DataPoint", () => {
    const point: DataPoint = {
      metricId: "m1",
      timestamp: "2026-07-27T00:00:00.000Z",
      value: 42,
    };

    expect(point.metricId).toBe("m1");
  });

  it("accepts a well-formed Signal", () => {
    const signal: Signal = {
      id: "s1",
      metricId: "m1",
      type: "increase",
      score: 80,
      direction: "up",
      timestamp: "2026-07-27T00:00:00.000Z",
      value: 42,
      changePercent: 12.5,
    };

    expect(signal.type).toBe("increase");
  });

  it("Detector.detect returns Signal[]", () => {
    const detector: Detector = { id: "noop", detect: () => [] };

    expect(detector.detect([])).toEqual([]);
  });

  it("Connector.fetch returns a Promise<DataPoint[]>", async () => {
    const connector: Connector = { id: "noop", fetch: async () => [] };

    await expect(connector.fetch()).resolves.toEqual([]);
  });
});
