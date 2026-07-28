export interface DataPoint {
  metricId: string;
  timestamp: string;
  value: number;
}

export type SignalType = "increase" | "decrease" | "spike" | "drop" | "threshold";

export type Direction = "up" | "down";

export interface Signal {
  id: string;
  metricId: string;
  type: SignalType;
  score: number;
  direction: Direction;
  timestamp: string;
  value: number;
  changePercent: number;
}

export interface Detector {
  id: string;
  detect(series: DataPoint[]): Signal[];
}

export interface Connector {
  id: string;
  fetch(): Promise<DataPoint[]>;
}
