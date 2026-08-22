import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.js";

describe("runCli", () => {
  let directory: string;
  let originalCwd: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "csv-to-signal-cli-"));
    originalCwd = process.cwd();
    process.chdir(directory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.chdir(originalCwd);
    rmSync(directory, { recursive: true, force: true });
  });

  function writeCsv(...lines: string[]): void {
    writeFileSync(join(directory, "data.csv"), `${lines.join("\n")}\n`, "utf-8");
  }

  function jsonResponse(body: unknown): Response {
    return new Response(JSON.stringify(body), { status: 200 });
  }

  function commit(sha: string, date: string): unknown {
    return { sha, commit: { committer: { date } } };
  }

  it("analyzes a CSV file and prints ranked JSON signals", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-07-27T00:00:00Z,100",
      "m1,2026-07-27T01:00:00Z,150",
      "m1,2026-07-27T02:00:00Z,151",
    );

    const signals = JSON.parse(await runCli(["analyze", "data.csv"]));

    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0]).toHaveProperty("score");
    expect(signals[0].metricId).toBe("m1");
  });

  it("applies --min-score to filter output", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-07-27T00:00:00Z,100",
      "m1,2026-07-27T01:00:00Z,101",
    );

    expect(JSON.parse(await runCli(["analyze", "data.csv", "--min-score", "90"]))).toEqual([]);
  });

  it("includes threshold signals when --threshold is passed", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-07-27T00:00:00Z,10",
      "m1,2026-07-27T01:00:00Z,200",
    );

    const signals = JSON.parse(
      await runCli(["analyze", "data.csv", "--threshold", "100"]),
    );
    expect(signals.some((signal: { type: string }) => signal.type === "threshold")).toBe(true);
  });

  it("includes a windowed signal when --window-hours is passed", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-08-01T23:00:00Z,100",
      "m1,2026-08-02T12:00:00Z,110",
      "m1,2026-08-03T00:00:00Z,150",
    );

    const signals = JSON.parse(
      await runCli(["analyze", "data.csv", "--window-hours", "24"]),
    ) as Array<{ id: string; changePercent: number }>;
    const windowed = signals.find((signal) => JSON.parse(signal.id)[0] === "windowed-change");

    expect(windowed?.changePercent).toBe(50);
  });

  it("uses the last repeated --window-hours value", async () => {
    writeCsv(
      "metricId,timestamp,value",
      "m1,2026-08-01T23:00:00Z,100",
      "m1,2026-08-02T12:00:00Z,110",
      "m1,2026-08-03T00:00:00Z,150",
    );

    const signals = JSON.parse(
      await runCli([
        "analyze",
        "data.csv",
        "--window-hours",
        "24",
        "--window-hours",
        "12",
      ]),
    ) as Array<{ id: string; changePercent: number }>;
    const windowed = signals.find((signal) => JSON.parse(signal.id)[0] === "windowed-change");

    expect(windowed?.changePercent).toBeCloseTo(36.363636, 5);
  });

  it("throws a usage error when the file argument is missing", async () => {
    await expect(runCli(["analyze"])).rejects.toThrow(/Usage:/);
  });

  it("throws a usage error for an unknown command", async () => {
    await expect(runCli(["bogus", "data.csv"])).rejects.toThrow(/Usage/);
  });

  it("throws a usage error for invalid flags and values", async () => {
    await expect(runCli(["analyze", "data.csv", "--unknown", "1"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--threshold"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--min-score", "nope"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--min-score", ""])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--window-hours"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--window-hours", "0"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--window-hours", "-1"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--window-hours", "nope"])).rejects.toThrow(/Usage/);
    await expect(runCli(["analyze", "data.csv", "--window-hours", "1e308"])).rejects.toThrow(/Usage/);
    expect(existsSync(join(directory, "data.db"))).toBe(false);
  });

  it("analyzes GitHub commits and forwards a trimmed optional token", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse([
        commit("first", "2026-08-01T12:00:00Z"),
        commit("second", "2026-08-02T12:00:00Z"),
        commit("third", "2026-08-02T13:00:00Z"),
      ]),
    );
    vi.stubGlobal("fetch", fetch);

    const signals = JSON.parse(
      await runCli(["github", "octocat/Hello-World"], { GITHUB_TOKEN: " test-token " }),
    ) as Array<{ metricId: string }>;

    expect(signals).toHaveLength(1);
    expect(signals[0].metricId).toBe("github:octocat/Hello-World:commits");
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer test-token",
    });
  });

  it("omits GitHub authorization when the environment token is blank", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal("fetch", fetch);

    await runCli(["github", "octocat/Hello-World"], { GITHUB_TOKEN: "   " });

    expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty("Authorization");
  });

  it("analyzes CoinGecko prices with defaults and an optional Demo key", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        prices: [
          [Date.parse("2026-08-01T00:00:00.000Z"), 100],
          [Date.parse("2026-08-02T00:00:00.000Z"), 125],
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const signals = JSON.parse(
      await runCli(["coingecko", "bitcoin"], {
        COINGECKO_DEMO_API_KEY: " demo-key ",
      }),
    ) as Array<{ metricId: string }>;

    expect(signals).toHaveLength(1);
    expect(signals[0].metricId).toBe("coingecko:bitcoin:price:usd");
    expect(fetch.mock.calls[0][0]).toBe(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30",
    );
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
      "x-cg-demo-api-key": "demo-key",
    });
  });

  it("uses CoinGecko keyless access when the Demo key is blank", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ prices: [] }));
    vi.stubGlobal("fetch", fetch);

    await runCli(["coingecko", "bitcoin"], { COINGECKO_DEMO_API_KEY: "   " });

    expect(fetch.mock.calls[0][1]?.headers).not.toHaveProperty("x-cg-demo-api-key");
  });

  it("applies explicit CoinGecko source and shared detector options", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        prices: [
          [Date.parse("2026-08-01T00:00:00.000Z"), 100],
          [Date.parse("2026-08-02T00:00:00.000Z"), 150],
        ],
      }),
    );
    vi.stubGlobal("fetch", fetch);

    const signals = JSON.parse(
      await runCli([
        "coingecko",
        "ethereum",
        "--vs-currency",
        "krw",
        "--days",
        "7",
        "--threshold",
        "120",
        "--window-hours",
        "24",
      ]),
    ) as Array<{ metricId: string; type: string }>;

    expect(signals.some((signal) => signal.type === "threshold")).toBe(true);
    expect(signals.every((signal) => signal.metricId === "coingecko:ethereum:price:krw")).toBe(
      true,
    );
    expect(fetch.mock.calls[0][0]).toContain("vs_currency=krw&days=7");
  });

  it("rejects external-source usage before database or network side effects", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(runCli(["github", "owner"])).rejects.toThrow(/Usage:/);
    await expect(runCli(["coingecko", "bitcoin", "--days", "0"])).rejects.toThrow(/Usage:/);

    expect(fetch).not.toHaveBeenCalled();
    expect(existsSync(join(directory, "data.db"))).toBe(false);
  });

  it("does not expose environment credentials in provider errors", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("forbidden", { status: 403 }));
    vi.stubGlobal("fetch", fetch);

    const result = runCli(["github", "octocat/private-repo"], {
      GITHUB_TOKEN: "must-not-appear",
    });
    await expect(result).rejects.toThrow("status 403");
    await expect(result).rejects.not.toThrow("must-not-appear");
  });
});
