import type { Signal } from "@signal-hub/types";

export function formatSignals(signals: Signal[]): string {
  return JSON.stringify(signals, null, 2);
}
