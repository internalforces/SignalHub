import { describe, expect, it } from "vitest";
import type { Signal } from "@signal-hub/types";
import { scoreSignals } from "../src/scoring.js";

function makeSignal(changePercent: number): Signal {
  return {
    id: "s1",
    metricId: "m1",
    type: "increase",
    score: 0,
    direction: "up",
    timestamp: "t0",
    value: 1,
    changePercent,
  };
}

describe("scoreSignals", () => {
  it("scales score linearly with absolute changePercent", () => {
    expect(scoreSignals([makeSignal(10)])[0].score).toBe(20);
  });

  it("scores negative changePercent by magnitude", () => {
    expect(scoreSignals([makeSignal(-25)])[0].score).toBe(50);
  });

  it("clamps score at 100", () => {
    expect(scoreSignals([makeSignal(200)])[0].score).toBe(100);
  });

  it("clamps score at 0 for a zero change", () => {
    expect(scoreSignals([makeSignal(0)])[0].score).toBe(0);
  });

  it("preserves relative ranking between signals", () => {
    const scored = scoreSignals([makeSignal(5), makeSignal(40)]);

    expect(scored[0].score).toBeLessThan(scored[1].score);
  });

  it("does not mutate the input signals", () => {
    const input = makeSignal(10);
    scoreSignals([input]);

    expect(input.score).toBe(0);
  });
});
