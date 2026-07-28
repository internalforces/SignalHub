import { randomUUID } from "node:crypto";
import type { DataPoint, Detector, Signal } from "@signal-hub/types";

export class ThresholdDetector implements Detector {
  readonly id = "threshold";

  constructor(private readonly threshold: number) {}

  detect(series: DataPoint[]): Signal[] {
    const sorted = [...series].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const signals: Signal[] = [];

    for (let index = 0; index < sorted.length; index += 1) {
      const current = sorted[index];
      const previous = index > 0 ? sorted[index - 1] : undefined;
      const crossed =
        current.value >= this.threshold &&
        (!previous || previous.value < this.threshold);

      if (!crossed) {
        continue;
      }

      const changePercent =
        ((current.value - this.threshold) / (Math.abs(this.threshold) || 1)) * 100;
      signals.push({
        id: randomUUID(),
        metricId: current.metricId,
        type: "threshold",
        score: 0,
        direction: "up",
        timestamp: current.timestamp,
        value: current.value,
        changePercent,
      });
    }

    return signals;
  }
}
