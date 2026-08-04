import { afterEach, describe, expect, it, vi } from "vitest";
import { CoinGeckoConnector } from "../src/index.js";
import type { CoinGeckoConnectorDiagnostic } from "../src/index.js";

const FIRST_TIMESTAMP = Date.parse("2026-08-01T00:00:00.000Z");
const SECOND_TIMESTAMP = Date.parse("2026-08-02T00:00:00.000Z");

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), { status: 200, ...init });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("CoinGeckoConnector", () => {
  it("requests the Demo market chart and normalizes prices", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({ prices: [[FIRST_TIMESTAMP, 64123.45], [SECOND_TIMESTAMP, 65000]] }),
    );
    const connector = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "USD",
      historyDays: 30,
      apiKey: "demo-secret",
      fetch,
    });

    await expect(connector.fetch()).resolves.toEqual([
      {
        metricId: "coingecko:bitcoin:price:usd",
        timestamp: "2026-08-01T00:00:00.000Z",
        value: 64123.45,
      },
      {
        metricId: "coingecko:bitcoin:price:usd",
        timestamp: "2026-08-02T00:00:00.000Z",
        value: 65000,
      },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          "x-cg-demo-api-key": "demo-secret",
        },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("sorts observations, skips malformed entries, and lets the last duplicate win", async () => {
    const fetch = vi.fn().mockResolvedValue(
      jsonResponse({
        prices: [
          [SECOND_TIMESTAMP, 20],
          null,
          ["not-a-timestamp", 10],
          [FIRST_TIMESTAMP, null],
          [FIRST_TIMESTAMP, 11],
          [SECOND_TIMESTAMP, 21],
        ],
      }),
    );
    const connector = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 2,
      fetch,
    });

    await expect(connector.fetch()).resolves.toEqual([
      {
        metricId: "coingecko:bitcoin:price:usd",
        timestamp: "2026-08-01T00:00:00.000Z",
        value: 11,
      },
      {
        metricId: "coingecko:bitcoin:price:usd",
        timestamp: "2026-08-02T00:00:00.000Z",
        value: 21,
      },
    ]);
    expect(connector.diagnostics).toEqual([
      { id: "price:2", reason: "invalid_record" },
      { id: "price:3", reason: "invalid_timestamp" },
      { id: "price:4", reason: "invalid_value" },
      { id: "price:6", reason: "duplicate_timestamp" },
    ]);
  });

  it("does not expose mutable diagnostic state", async () => {
    const fetch = vi.fn().mockResolvedValue(jsonResponse({ prices: [null] }));
    const connector = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 1,
      fetch,
    });

    await connector.fetch();
    (connector.diagnostics as CoinGeckoConnectorDiagnostic[]).push({
      id: "mutated",
      reason: "invalid_record",
    });

    expect(connector.diagnostics).toEqual([{ id: "price:1", reason: "invalid_record" }]);
  });

  it("validates constructor options", () => {
    expect(
      () => new CoinGeckoConnector({ coinId: " ", vsCurrency: "usd", historyDays: 1 }),
    ).toThrow("non-empty coinId and vsCurrency");
    expect(
      () => new CoinGeckoConnector({ coinId: "bitcoin", vsCurrency: "usd", historyDays: 0 }),
    ).toThrow("positive integer historyDays");
  });

  it("surfaces redacted request and response errors", async () => {
    const apiKey = "must-not-appear";
    const failed = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 1,
      apiKey,
      fetch: vi.fn().mockResolvedValue(new Response("limited", { status: 429 })),
    });
    const invalidJson = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 1,
      fetch: vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    });
    const missingPrices = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 1,
      fetch: vi.fn().mockResolvedValue(jsonResponse({ market_caps: [] })),
    });

    await expect(failed.fetch()).rejects.toThrow("status 429");
    await expect(failed.fetch()).rejects.not.toThrow(apiKey);
    await expect(invalidJson.fetch()).rejects.toThrow("not valid JSON");
    await expect(missingPrices.fetch()).rejects.toThrow("prices array");
  });

  it("rejects a response declared above the 5 MiB limit", async () => {
    const connector = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 1,
      fetch: vi.fn().mockResolvedValue(
        jsonResponse(
          { prices: [] },
          { headers: { "Content-Length": String(5 * 1024 * 1024 + 1) } },
        ),
      ),
    });

    await expect(connector.fetch()).rejects.toThrow("exceeded 5 MiB");
  });

  it("aborts a request after 15 seconds", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
    );
    const connector = new CoinGeckoConnector({
      coinId: "bitcoin",
      vsCurrency: "usd",
      historyDays: 1,
      fetch,
    });

    const result = expect(connector.fetch()).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(15_000);

    await result;
  });
});
