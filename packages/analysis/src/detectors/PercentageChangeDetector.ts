import { randomUUID } from "node:crypto";
import type { DataPoint, Detector, Signal } from "@signal-hub/types";

export class PercentageChangeDetector implements Detector {
  readonly id = "percentage-change";

  constructor(private readonly minChangePercent: number = 0) {}

  detect(series: DataPoint[]): Signal[] {
    const sorted = [...series].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const signals: Signal[] = [];

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];

      if (previous.value === 0) {
        continue;
      }

      const changePercent =
        ((current.value - previous.value) / Math.abs(previous.value)) * 100;
      if (Math.abs(changePercent) < this.minChangePercent) {
        continue;
      }

      signals.push({
        id: randomUUID(),
        metricId: current.metricId,
        type: changePercent > 0 ? "increase" : "decrease",
        score: 0,
        direction: changePercent > 0 ? "up" : "down",
        timestamp: current.timestamp,
        value: current.value,
        changePercent,
      });
    }

    return signals;
  }
}
