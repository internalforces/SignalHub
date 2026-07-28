import { describe, expect, it } from "vitest";
import { isValidDataPoint } from "../src/validate.js";

describe("isValidDataPoint", () => {
  it("accepts a well-formed point", () => {
    expect(
      isValidDataPoint({
        metricId: "m1",
        timestamp: "2026-07-27T00:00:00.000Z",
        value: 42,
      }),
    ).toBe(true);
  });

  it("rejects an empty metricId", () => {
    expect(
      isValidDataPoint({
        metricId: "",
        timestamp: "2026-07-27T00:00:00.000Z",
        value: 42,
      }),
    ).toBe(false);
  });

  it("rejects a non-finite value", () => {
    expect(
      isValidDataPoint({
        metricId: "m1",
        timestamp: "2026-07-27T00:00:00.000Z",
        value: Number.NaN,
      }),
    ).toBe(false);
    expect(
      isValidDataPoint({
        metricId: "m1",
        timestamp: "2026-07-27T00:00:00.000Z",
        value: Number.POSITIVE_INFINITY,
      }),
    ).toBe(false);
  });

  it("rejects an unparseable timestamp", () => {
    expect(
      isValidDataPoint({ metricId: "m1", timestamp: "not-a-date", value: 42 }),
    ).toBe(false);
  });
});
