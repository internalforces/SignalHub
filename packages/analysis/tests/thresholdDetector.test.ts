import { describe, expect, it } from "vitest";
import type { DataPoint } from "@signal-hub/types";
import { ThresholdDetector } from "../src/detectors/ThresholdDetector.js";

describe("ThresholdDetector", () => {
  it("fires when the series crosses the threshold", () => {
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 90 },
      { metricId: "m1", timestamp: "t1", value: 105 },
    ];
    const signals = new ThresholdDetector(100).detect(series);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      type: "threshold",
      direction: "up",
      value: 105,
      timestamp: "t1",
    });
  });

  it("fires when the first point is exactly at the threshold", () => {
    expect(
      new ThresholdDetector(100).detect([{ metricId: "m1", timestamp: "t0", value: 100 }]),
    ).toHaveLength(1);
  });

  it("does not fire again while the value stays above the threshold", () => {
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 105 },
      { metricId: "m1", timestamp: "t1", value: 110 },
    ];

    expect(new ThresholdDetector(100).detect(series)).toHaveLength(1);
  });

  it("does not fire while the value stays below the threshold", () => {
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 10 },
      { metricId: "m1", timestamp: "t1", value: 20 },
    ];

    expect(new ThresholdDetector(100).detect(series)).toHaveLength(0);
  });

  it("fires again after dropping below and re-crossing", () => {
    const series: DataPoint[] = [
      { metricId: "m1", timestamp: "t0", value: 105 },
      { metricId: "m1", timestamp: "t1", value: 95 },
      { metricId: "m1", timestamp: "t2", value: 101 },
    ];

    expect(new ThresholdDetector(100).detect(series)).toHaveLength(2);
  });
});
