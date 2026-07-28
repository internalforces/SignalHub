export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS data_points (
  id TEXT PRIMARY KEY,
  metric_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  value REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_data_points_metric_timestamp ON data_points (metric_id, timestamp);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  metric_id TEXT NOT NULL,
  type TEXT NOT NULL,
  score REAL NOT NULL,
  direction TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  value REAL NOT NULL,
  change_percent REAL NOT NULL
);
`;
