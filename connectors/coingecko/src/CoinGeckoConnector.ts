import type { Connector, DataPoint } from "@signal-hub/connector-sdk";

const API_BASE_URL = "https://api.coingecko.com";
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

type FetchImplementation = typeof fetch;

export type CoinGeckoConnectorDiagnosticReason =
  | "invalid_record"
  | "invalid_timestamp"
  | "invalid_value"
  | "duplicate_timestamp";

export interface CoinGeckoConnectorOptions {
  coinId: string;
  vsCurrency: string;
  historyDays: number;
  apiKey?: string;
  fetch?: FetchImplementation;
}

export interface CoinGeckoConnectorDiagnostic {
  id: string;
  reason: CoinGeckoConnectorDiagnosticReason;
}

export class CoinGeckoConnector implements Connector {
  readonly id: string;
  private readonly coinId: string;
  private readonly vsCurrency: string;
  private readonly historyDays: number;
  private readonly apiKey?: string;
  private readonly fetchImplementation: FetchImplementation;
  private lastDiagnostics: CoinGeckoConnectorDiagnostic[] = [];

  constructor(options: CoinGeckoConnectorOptions) {
    this.coinId = options.coinId.trim();
    this.vsCurrency = options.vsCurrency.trim().toLowerCase();
    if (!this.coinId || !this.vsCurrency) {
      throw new Error("CoinGecko connector requires non-empty coinId and vsCurrency values");
    }
    if (!Number.isInteger(options.historyDays) || options.historyDays <= 0) {
      throw new Error("CoinGecko connector requires a positive integer historyDays value");
    }

    this.historyDays = options.historyDays;
    this.apiKey = options.apiKey?.trim() || undefined;
    this.fetchImplementation = options.fetch ?? globalThis.fetch;
    this.id = `coingecko:${this.coinId}:price:${this.vsCurrency}`;
  }

  get diagnostics(): readonly CoinGeckoConnectorDiagnostic[] {
    return this.lastDiagnostics.map((diagnostic) => ({ ...diagnostic }));
  }

  async fetch(): Promise<DataPoint[]> {
    this.lastDiagnostics = [];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await this.request(controller.signal);
      const body = await this.readJson(response);
      if (!isRecord(body) || !Array.isArray(body.prices)) {
        throw new Error("CoinGecko response did not contain a prices array");
      }

      return this.normalizePrices(body.prices);
    } catch (error) {
      if (controller.signal.aborted || isAbortError(error)) {
        throw new Error("CoinGecko request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async request(signal: AbortSignal): Promise<Response> {
    const url = new URL(
      `/api/v3/coins/${encodeURIComponent(this.coinId)}/market_chart`,
      API_BASE_URL,
    );
    url.searchParams.set("vs_currency", this.vsCurrency);
    url.searchParams.set("days", String(this.historyDays));

    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.apiKey) {
      headers["x-cg-demo-api-key"] = this.apiKey;
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(url.toString(), { headers, signal });
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      throw new Error("CoinGecko request failed");
    }

    if (!response.ok) {
      throw new Error(`CoinGecko request failed with status ${response.status}`);
    }
    return response;
  }

  private async readJson(response: Response): Promise<unknown> {
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new Error("CoinGecko response exceeded 5 MiB");
    }

    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        totalBytes += value.byteLength;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new Error("CoinGecko response exceeded 5 MiB");
        }
        chunks.push(value);
      }
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    try {
      return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    } catch {
      throw new Error("CoinGecko response was not valid JSON");
    }
  }

  private normalizePrices(prices: unknown[]): DataPoint[] {
    const pointsByTimestamp = new Map<string, DataPoint>();

    prices.forEach((observation, index) => {
      const diagnosticId = `price:${index + 1}`;
      if (!Array.isArray(observation) || observation.length < 2) {
        this.lastDiagnostics.push({ id: diagnosticId, reason: "invalid_record" });
        return;
      }

      const [timestamp, value] = observation;
      if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
        this.lastDiagnostics.push({ id: diagnosticId, reason: "invalid_timestamp" });
        return;
      }

      let normalizedTimestamp: string;
      try {
        normalizedTimestamp = new Date(timestamp).toISOString();
      } catch {
        this.lastDiagnostics.push({ id: diagnosticId, reason: "invalid_timestamp" });
        return;
      }

      if (typeof value !== "number" || !Number.isFinite(value)) {
        this.lastDiagnostics.push({ id: diagnosticId, reason: "invalid_value" });
        return;
      }

      if (pointsByTimestamp.has(normalizedTimestamp)) {
        this.lastDiagnostics.push({ id: diagnosticId, reason: "duplicate_timestamp" });
      }
      pointsByTimestamp.set(normalizedTimestamp, {
        metricId: this.id,
        timestamp: normalizedTimestamp,
        value,
      });
    });

    return [...pointsByTimestamp.values()].sort((first, second) =>
      first.timestamp.localeCompare(second.timestamp),
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isAbortError(value: unknown): boolean {
  return value instanceof DOMException && value.name === "AbortError";
}
