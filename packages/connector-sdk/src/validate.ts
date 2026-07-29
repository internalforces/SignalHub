import type { DataPoint } from "@signal-hub/types";

export function isValidDataPoint(point: DataPoint): boolean {
  return (
    typeof point.metricId === "string" &&
    point.metricId.length > 0 &&
    typeof point.value === "number" &&
    Number.isFinite(point.value) &&
    typeof point.timestamp === "string" &&
    !Number.isNaN(Date.parse(point.timestamp))
  );
}
