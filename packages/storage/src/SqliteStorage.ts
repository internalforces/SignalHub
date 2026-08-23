import Database from "better-sqlite3";
import type { DataPoint, Signal } from "@signal-hub/types";
import { SCHEMA_SQL } from "./schema.js";

export interface DataPointRepository {
  insertMany(points: DataPoint[], namespace?: string): void;
  replaceMany(points: DataPoint[], namespace?: string): void;
  getByMetric(metricId: string, namespace?: string): DataPoint[];
}

export interface SignalRepository {
  insertMany(signals: Signal[], namespace?: string): void;
  getAll(namespace?: string): Signal[];
}

interface StoredDataPoint extends DataPoint {
  id: string;
}

const DATA_POINT_NAMESPACE_TAG = "signal-hub:data-point";
const SIGNAL_NAMESPACE_TAG = "signal-hub:signal";

export class SqliteStorage {
  private db: Database.Database;
  readonly dataPoints: DataPointRepository;
  readonly signals: SignalRepository;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(SCHEMA_SQL);

    const insertPointStmt = this.db.prepare(
      "INSERT OR IGNORE INTO data_points (id, metric_id, timestamp, value) VALUES (@id, @metric_id, @timestamp, @value)",
    );
    const replacePointStmt = this.db.prepare(
      `INSERT INTO data_points (id, metric_id, timestamp, value)
       VALUES (@id, @metric_id, @timestamp, @value)
       ON CONFLICT(id) DO UPDATE SET value = excluded.value`,
    );
    const getByMetricStmt = this.db.prepare(
      "SELECT id, metric_id as metricId, timestamp, value FROM data_points WHERE metric_id = ? ORDER BY timestamp ASC",
    );
    this.dataPoints = {
      insertMany: (points, namespace) => {
        const transaction = this.db.transaction((rows: DataPoint[]) => {
          for (const point of rows) {
            insertPointStmt.run({
              id: dataPointId(point, namespace),
              metric_id: point.metricId,
              timestamp: point.timestamp,
              value: point.value,
            });
          }
        });
        transaction(points);
      },
      replaceMany: (points, namespace) => {
        const transaction = this.db.transaction((rows: DataPoint[]) => {
          for (const point of rows) {
            replacePointStmt.run({
              id: dataPointId(point, namespace),
              metric_id: point.metricId,
              timestamp: point.timestamp,
              value: point.value,
            });
          }
        });
        transaction(points);
      },
      getByMetric: (metricId, namespace) =>
        (getByMetricStmt.all(metricId) as StoredDataPoint[])
          .filter((point) => point.id === dataPointId(point, namespace))
          .map(({ id: _id, ...point }) => point),
    };

    const insertSignalStmt = this.db.prepare(
      `INSERT OR IGNORE INTO signals (id, metric_id, type, score, direction, timestamp, value, change_percent)
       VALUES (@id, @metric_id, @type, @score, @direction, @timestamp, @value, @change_percent)`,
    );
    const getAllSignalsStmt = this.db.prepare(
      `SELECT id, metric_id as metricId, type, score, direction, timestamp, value, change_percent as changePercent
       FROM signals ORDER BY score DESC`,
    );
    this.signals = {
      insertMany: (signals, namespace) => {
        const transaction = this.db.transaction((rows: Signal[]) => {
          for (const signal of rows) {
            insertSignalStmt.run({
              id: persistedSignalId(signal.id, namespace),
              metric_id: signal.metricId,
              type: signal.type,
              score: signal.score,
              direction: signal.direction,
              timestamp: signal.timestamp,
              value: signal.value,
              change_percent: signal.changePercent,
            });
          }
        });
        transaction(signals);
      },
      getAll: (namespace) =>
        (getAllSignalsStmt.all() as Signal[]).flatMap((signal) => {
          const id = restoredSignalId(signal.id, namespace);
          return id === undefined ? [] : [{ ...signal, id }];
        }),
    };
  }

  close(): void {
    this.db.close();
  }
}

function dataPointId(point: DataPoint, namespace: string | undefined): string {
  if (namespace === undefined) {
    return `${point.metricId}::${point.timestamp}`;
  }
  return JSON.stringify([
    DATA_POINT_NAMESPACE_TAG,
    namespace,
    point.metricId,
    point.timestamp,
  ]);
}

function persistedSignalId(id: string, namespace: string | undefined): string {
  return namespace === undefined
    ? id
    : JSON.stringify([SIGNAL_NAMESPACE_TAG, namespace, id]);
}

function restoredSignalId(id: string, namespace: string | undefined): string | undefined {
  try {
    const value: unknown = JSON.parse(id);
    if (
      Array.isArray(value) &&
      value.length === 3 &&
      value[0] === SIGNAL_NAMESPACE_TAG &&
      typeof value[1] === "string" &&
      typeof value[2] === "string"
    ) {
      return value[1] === namespace ? value[2] : undefined;
    }
  } catch {
    return namespace === undefined ? id : undefined;
  }
  return namespace === undefined ? id : undefined;
}
