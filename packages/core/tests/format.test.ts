import { describe, expect, it } from "vitest";
import type { Signal } from "@signal-hub/types";
import { formatSignals } from "../src/format.js";

describe("formatSignals", () => {
  it("pretty-prints signals as JSON", () => {
    const signals: Signal[] = [
      {
        id: "s1",
        metricId: "m1",
        type: "increase",
        score: 80,
        direction: "up",
        timestamp: "t0",
        value: 10,
        changePercent: 40,
      },
    ];

    expect(formatSignals(signals)).toBe(JSON.stringify(signals, null, 2));
  });

  it("formats an empty list as an empty JSON array", () => {
    expect(formatSignals([])).toBe("[]");
  });
});
