import { describe, expect, it } from "vitest";
import type { DataPoint } from "@signal-hub/types";
import { WindowedChangeDetector, scoreSignals } from "../src/index.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function point(timestamp: string, value: number, metricId = "m1"): DataPoint {
  return { metricId, timestamp, value };
}

describe("WindowedChangeDetector", () => {
  it("uses the newest point at or before a 24-hour boundary", () => {
    const series = [
      point("2026-08-01T00:00:00.000Z", 80),
      point("2026-08-01T23:00:00.000Z", 100),
      point("2026-08-02T23:30:00.000Z", 120),
      point("2026-08-03T00:00:00.000Z", 150),
    ];

    const signals = new WindowedChangeDetector(DAY_MS).detect(series);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      metricId: "m1",
      type: "increase",
      direction: "up",
      timestamp: "2026-08-03T00:00:00.000Z",
      value: 150,
      changePercent: 50,
      score: 0,
    });
  });

  it("supports a 7-day window over irregularly spaced data", () => {
    const series = [
      point("2026-07-01T00:00:00.000Z", 200),
      point("2026-07-03T12:00:00.000Z", 180),
      point("2026-07-09T00:00:00.000Z", 150),
      point("2026-07-10T12:00:00.000Z", 100),
    ];

    const [signal] = new WindowedChangeDetector(7 * DAY_MS).detect(series);

    expect(signal.type).toBe("decrease");
    expect(signal.direction).toBe("down");
    expect(signal.changePercent).toBeCloseTo(-44.444444, 5);
  });

  it("supports caller-defined positive windows and unsorted input", () => {
    const series = [
      point("2026-08-01T06:00:00.000Z", 130),
      point("2026-08-01T00:00:00.000Z", 100),
      point("2026-08-01T03:30:00.000Z", 125),
      point("2026-08-01T02:00:00.000Z", 120),
    ];

    const [signal] = new WindowedChangeDetector(3 * 60 * 60 * 1000).detect(series);

    expect(signal.changePercent).toBeCloseTo(8.333333, 5);
    expect(series.map(({ timestamp }) => timestamp)).toEqual([
      "2026-08-01T06:00:00.000Z",
      "2026-08-01T00:00:00.000Z",
      "2026-08-01T03:30:00.000Z",
      "2026-08-01T02:00:00.000Z",
    ]);
  });

  it("returns no signal when no point exists at or before the boundary", () => {
    const series = [
      point("2026-08-02T12:00:00.000Z", 100),
      point("2026-08-03T00:00:00.000Z", 120),
    ];

    expect(new WindowedChangeDetector(DAY_MS).detect(series)).toEqual([]);
  });

  it("returns no signal when the reference value is zero", () => {
    const series = [
      point("2026-08-01T00:00:00.000Z", 0),
      point("2026-08-02T00:00:00.000Z", 10),
    ];

    expect(new WindowedChangeDetector(DAY_MS).detect(series)).toEqual([]);
  });

  it("returns no signal when the windowed change is zero", () => {
    const series = [
      point("2026-08-01T00:00:00.000Z", 100),
      point("2026-08-02T00:00:00.000Z", 100),
    ];

    expect(new WindowedChangeDetector(DAY_MS).detect(series)).toEqual([]);
  });

  it("suppresses changes below minChangePercent", () => {
    const series = [
      point("2026-08-01T00:00:00.000Z", 100),
      point("2026-08-02T00:00:00.000Z", 110),
    ];

    expect(new WindowedChangeDetector(DAY_MS, 10.1).detect(series)).toEqual([]);
  });

  it("returns at most one signal for a series", () => {
    const series = [
      point("2026-07-31T00:00:00.000Z", 50),
      point("2026-08-01T00:00:00.000Z", 100),
      point("2026-08-02T00:00:00.000Z", 150),
    ];

    expect(new WindowedChangeDetector(DAY_MS).detect(series)).toHaveLength(1);
  });

  it("generates the same configuration-scoped id for equal inputs", () => {
    const series = [
      point("2026-08-01T00:00:00.000Z", 100),
      point("2026-08-02T00:00:00.000Z", 120),
    ];

    const first = new WindowedChangeDetector(DAY_MS, 5).detect(series)[0];
    const second = new WindowedChangeDetector(DAY_MS, 5).detect(series)[0];
    const otherWindow = new WindowedChangeDetector(12 * 60 * 60 * 1000, 5).detect(series)[0];

    expect(first.id).toBe(second.id);
    expect(first.id).not.toBe(otherWindow.id);
  });

  it("reuses the existing signal scoring behavior", () => {
    const series = [
      point("2026-08-01T00:00:00.000Z", 100),
      point("2026-08-02T00:00:00.000Z", 120),
    ];

    const signals = new WindowedChangeDetector(DAY_MS).detect(series);

    expect(scoreSignals(signals)[0].score).toBe(40);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid window: %s",
    (windowMs) => {
      expect(() => new WindowedChangeDetector(windowMs)).toThrow(RangeError);
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid minimum change: %s",
    (minChangePercent) => {
      expect(() => new WindowedChangeDetector(DAY_MS, minChangePercent)).toThrow(RangeError);
    },
  );
});
