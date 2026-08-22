import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../src/arguments.js";

describe("parseCliArgs", () => {
  it("preserves the CSV command and parses shared detector options", () => {
    expect(
      parseCliArgs([
        "analyze",
        "prices.csv",
        "--min-score",
        "40",
        "--threshold",
        "120",
        "--window-hours",
        "24",
      ]),
    ).toEqual({
      source: "csv",
      filePath: "prices.csv",
      minScore: 40,
      threshold: 120,
      windowMs: 86_400_000,
    });
  });

  it("parses a GitHub owner/repository input", () => {
    expect(parseCliArgs(["github", " octocat/Hello-World "])).toEqual({
      source: "github",
      owner: "octocat",
      repo: "Hello-World",
      minScore: undefined,
      threshold: undefined,
      windowMs: undefined,
    });
  });

  it("parses CoinGecko defaults and explicit source options", () => {
    expect(parseCliArgs(["coingecko", "bitcoin"])).toEqual({
      source: "coingecko",
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 30,
      minScore: undefined,
      threshold: undefined,
      windowMs: undefined,
    });
    expect(
      parseCliArgs(["coingecko", "ethereum", "--vs-currency", " KRW ", "--days", "7"]),
    ).toMatchObject({ coinId: "ethereum", vsCurrency: "KRW", historyDays: 7 });
  });

  it("uses the last repeated option value", () => {
    expect(
      parseCliArgs([
        "coingecko",
        "bitcoin",
        "--days",
        "7",
        "--days",
        "30",
        "--window-hours",
        "24",
        "--window-hours",
        "12",
      ]),
    ).toMatchObject({ historyDays: 30, windowMs: 43_200_000 });
  });

  it("rejects an invalid earlier repeated numeric option", () => {
    expect(() =>
      parseCliArgs(["analyze", "prices.csv", "--min-score", "nope", "--min-score", "40"]),
    ).toThrow(/Usage:/);
    expect(() =>
      parseCliArgs(["coingecko", "bitcoin", "--days", "0", "--days", "30"]),
    ).toThrow(/Usage:/);
    expect(() =>
      parseCliArgs([
        "github",
        "owner/repo",
        "--window-hours",
        "0",
        "--window-hours",
        "24",
      ]),
    ).toThrow(/Usage:/);
  });

  it("preserves leading and trailing spaces in a nonblank CSV path", () => {
    expect(parseCliArgs(["analyze", " prices.csv "])).toMatchObject({
      source: "csv",
      filePath: " prices.csv ",
    });
  });

  it("rejects malformed commands, positions, and source-specific options", () => {
    expect(() => parseCliArgs([])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["bogus", "value"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["analyze", "--threshold", "1"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "owner"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "/repo"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "owner/repo/extra"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["github", "owner/repo", "--days", "7"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["analyze", "prices.csv", "extra"])).toThrow(/Usage:/);
  });

  it("rejects missing, empty, and invalid option values", () => {
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--days"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--days", "0"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--days", "1.5"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--vs-currency", " "])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--min-score", "nope"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--window-hours", "0"])).toThrow(/Usage:/);
    expect(() => parseCliArgs(["coingecko", "bitcoin", "--window-hours", "1e308"])).toThrow(/Usage:/);
  });
});
