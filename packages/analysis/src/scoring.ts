import type { Signal } from "@signal-hub/types";

export function scoreSignals(signals: Signal[]): Signal[] {
  return signals.map((signal) => ({
    ...signal,
    score: Math.min(100, Math.max(0, Math.round(Math.abs(signal.changePercent) * 2))),
  }));
}
