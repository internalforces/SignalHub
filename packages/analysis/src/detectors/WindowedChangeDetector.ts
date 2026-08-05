import type { DataPoint, Detector, Signal } from "@signal-hub/types";

export class WindowedChangeDetector implements Detector {
  readonly id = "windowed-change";

  constructor(
    private readonly windowMs: number,
    private readonly minChangePercent: number = 0,
  ) {
    if (!Number.isFinite(windowMs) || windowMs <= 0) {
      throw new RangeError("windowMs must be a positive finite number");
    }
    if (!Number.isFinite(minChangePercent) || minChangePercent < 0) {
      throw new RangeError("minChangePercent must be a non-negative finite number");
    }
  }

  detect(series: DataPoint[]): Signal[] {
    if (series.length < 2) {
      return [];
    }

    const sorted = [...series].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const current = sorted[sorted.length - 1];
    const boundary = Date.parse(current.timestamp) - this.windowMs;

    let reference: DataPoint | undefined;
    for (let index = sorted.length - 2; index >= 0; index -= 1) {
      const candidate = sorted[index];
      if (
        candidate.metricId === current.metricId &&
        Date.parse(candidate.timestamp) <= boundary
      ) {
        reference = candidate;
        break;
      }
    }

    if (!reference || reference.value === 0) {
      return [];
    }

    const changePercent =
      ((current.value - reference.value) / Math.abs(reference.value)) * 100;
    if (changePercent === 0 || Math.abs(changePercent) < this.minChangePercent) {
      return [];
    }

    return [
      {
        id: JSON.stringify([
          this.id,
          this.windowMs,
          this.minChangePercent,
          current.metricId,
          reference.timestamp,
          reference.value,
          current.timestamp,
          current.value,
          changePercent,
        ]),
        metricId: current.metricId,
        type: changePercent > 0 ? "increase" : "decrease",
        score: 0,
        direction: changePercent > 0 ? "up" : "down",
        timestamp: current.timestamp,
        value: current.value,
        changePercent,
      },
    ];
  }
}
