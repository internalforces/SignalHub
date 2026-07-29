import { describe, expect, it } from "vitest";
import type { DataPoint } from "@signal-hub/types";
import { PercentageChangeDetector } from "../src/detectors/PercentageChangeDetector.js";

const series: DataPoint[] = [
  { metricId: "m1", timestamp: "2026-07-27T00:00:00.000Z", value: 100 },
  { metricId: "m1", timestamp: "2026-07-27T01:00:00.000Z", value: 110 },
  { metricId: "m1", timestamp: "2026-07-27T02:00:00.000Z", value: 99 },
];

describe("PercentageChangeDetector", () => {
  it("emits an increase signal when value rises", () => {
    const signals = new PercentageChangeDetector().detect(series.slice(0, 2));

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      type: "increase",
      direction: "up",
      value: 110,
      changePercent: 10,
    });
  });

  it("emits a decrease signal when value falls", () => {
    const signals = new PercentageChangeDetector().detect([series[1], series[2]]);

    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("decrease");
    expect(signals[0].direction).toBe("down");
    expect(signals[0].changePercent).toBeCloseTo(-10, 5);
  });

  it("suppresses signals below minChangePercent", () => {
    expect(new PercentageChangeDetector(50).detect(series.slice(0, 2))).toHaveLength(0);
  });

  it("skips a point when the previous value is zero", () => {
    const zeroSeries: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 0 },
      { metricId: "m1", timestamp: "t1", value: 5 },
    ];

    expect(new PercentageChangeDetector().detect(zeroSeries)).toHaveLength(0);
  });

  it("does not emit a signal when the value is unchanged", () => {
    const unchangedSeries: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 10 },
      { metricId: "m1", timestamp: "t1", value: 10 },
    ];

    expect(new PercentageChangeDetector().detect(unchangedSeries)).toEqual([]);
  });

  it("generates the same signal id for the same series", () => {
    const detector = new PercentageChangeDetector();

    expect(detector.detect(series.slice(0, 2))[0].id).toBe(
      detector.detect(series.slice(0, 2))[0].id,
    );
  });

  it("returns no signals for a series with fewer than two points", () => {
    const detector = new PercentageChangeDetector();

    expect(detector.detect([series[0]])).toHaveLength(0);
    expect(detector.detect([])).toHaveLength(0);
  });
});
