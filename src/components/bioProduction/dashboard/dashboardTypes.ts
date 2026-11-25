export type AlertSeverity = 'ok' | 'watch' | 'critical';

export interface ConditionAlert {
  kind: 'reading' | 'unmeasured';
  farm?: string | null;
  severity: AlertSeverity;
  unit_id: number;
  unit: string;
  unit_type: string;
  parameter?: string;
  unit_label?: string | null;
  decimals?: number;
  value?: number;
  measured_at?: string;
  last_measured_at?: string | null;
  days?: number | null;
}

export interface MortalityAlert {
  farm?: string | null;
  batch_id: number;
  batchNo: string;
  unit: string;
  stage: string;
  abnormal: number;
  died: number;
  opening: number;
  allowed_pct: number;
  severity: AlertSeverity;
}

export interface FeedingAlert {
  farm?: string | null;
  batch_id: number;
  batchNo: string;
  unit: string;
  stage: string | null;
  days: number;
  never: boolean;
  severity: AlertSeverity;
}

export interface StageAlert {
  farm?: string | null;
  batch_id: number;
  batchNo: string;
  unit: string;
  stage: string;
  expected_days: number;
  over_days: number;
  severity: AlertSeverity;
}

export interface Dashboard {
  farms: { id: number; name: string }[];
  generated_at: string;
  range: { from: string; to: string };
  summary: {
    open_batches: number;
    animals_alive: number;
    biomass: { kg: number; weighed: number; estimated: number; unknown: number };
    units_total: number;
    units_in_use: number;
    wip_balance: number;
    mortality: { current: number; previous: number };
    feed_cost: { current: number; previous: number };
    fcr: { current: { value: number | null; feed_kg: number; gain_kg: number; batches: number; without_weights: number }; previous: number | null };
    harvest: { animals: number; quantity: number; cost: number };
    produce: { product: string; quantity: number }[];
  };
  occupancy: { type: string; total: number; in_use: number }[];
  alerts: { conditions: ConditionAlert[]; mortality: MortalityAlert[]; feeding: FeedingAlert[]; stages: StageAlert[] };
  activity: { id: number; recordNo: string; kind: string; farm?: string | null; record_date: string; lines_count: number; creator: string | null }[];
}

export type Grouping = 'day' | 'week' | 'month' | 'year';
export type TrendMetric = 'deaths' | 'feed' | 'readings' | 'output' | 'fcr';

export interface TrendPeriod {
  period: string;
  [series: string]: string | number | null;
}
