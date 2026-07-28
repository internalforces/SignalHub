import Database from "better-sqlite3";
import type { DataPoint, Signal } from "@signal-hub/types";
import { SCHEMA_SQL } from "./schema.js";

export interface DataPointRepository {
  insertMany(points: DataPoint[]): void;
  getByMetric(metricId: string): DataPoint[];
}

export interface SignalRepository {
  insertMany(signals: Signal[]): void;
  getAll(): Signal[];
}

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
    const getByMetricStmt = this.db.prepare(
      "SELECT metric_id as metricId, timestamp, value FROM data_points WHERE metric_id = ? ORDER BY timestamp ASC",
    );
    this.dataPoints = {
      insertMany: (points) => {
        const transaction = this.db.transaction((rows: DataPoint[]) => {
          for (const point of rows) {
            insertPointStmt.run({
              id: `${point.metricId}::${point.timestamp}`,
              metric_id: point.metricId,
              timestamp: point.timestamp,
              value: point.value,
            });
          }
        });
        transaction(points);
      },
      getByMetric: (metricId) => getByMetricStmt.all(metricId) as DataPoint[],
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
      insertMany: (signals) => {
        const transaction = this.db.transaction((rows: Signal[]) => {
          for (const signal of rows) {
            insertSignalStmt.run({
              id: signal.id,
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
      getAll: () => getAllSignalsStmt.all() as Signal[],
    };
  }

  close(): void {
    this.db.close();
  }
}
