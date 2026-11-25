/** The kinds of record entered against batches; a measurement record is entered against production units instead. */
export type BatchRoundMode = Exclude<RoundMode, 'measurement'>;

export type RoundMode = 'feeding' | 'mortality' | 'weighing' | 'cost' | 'harvest' | 'produce' | 'measurement';

/** An open batch, as offered when choosing the production unit to record against. */
export interface RoundBatchRow {
  batch_id: number;
  batchNo: string;
  unit: { id: number; name: string; type: string };
  stage: { id: number; name: string } | null;
  current_quantity: number;
  species: { name: string; count_label: string; weight_unit?: 'g' | 'kg' };
}

export interface RoundRecord {
  id: number;
  recordNo: string;
  kind: RoundMode;
  record_date: string;
  farm?: { id: number; name: string };
  input_type?: 'feed' | 'medication' | 'other' | null;
  reason?: string | null;
  cause?: string | null;
  store?: { id: number; name: string } | null;
  product?: { id: number; name: string } | null;
  measurement_unit?: { id: number; name: string; symbol?: string } | null;
  lines_count: number;
  total_quantity?: number | string | null;
  creator?: { id: number; name: string } | null;
  ledger?: { id: number; name: string } | null;
  rate?: number | string | null;
  /** The payment made when the record was saved, for a cost record that was paid. */
  payment?: { id: number; voucherNo: string; reference?: string | null; credit_ledger?: { id: number; name: string } | null } | null;
  /** On the list: the payment this cost record made, if any. */
  paymentNo?: string | null;
  lines?: RoundLine[];
}

export interface RoundLine {
  batch_id: number;
  batchNo: string;
  unit: { id: number; name: string } | null;
  stage: { id: number; name: string } | null;
  quantity?: number | string | null;
  cost?: number | string | null;
  cause?: string | null;
  sample_size?: number | null;
  average_weight_g?: number | null;
  weight_unit?: 'g' | 'kg';
  /** For a weighing: the saved weighing, its date, what the species counts animals as and whether the batch is still open. */
  sample_id?: number;
  sample_date?: string;
  count_label?: string | null;
  batch_open?: boolean;
  rate?: number | string | null;
  amount?: number | string | null;
  product_quantity?: number | string | null;
  /** For a measurement record: what was measured, and how the value stands against its limits. */
  parameter?: { id: number; name: string; unit_label?: string | null; decimals?: number };
  value?: number;
  status?: 'ok' | 'watch' | 'critical';
  measured_at?: string;
}

/** A line of the record being built: the batch chosen and what was typed against it. */
export interface RoundDraftLine {
  row: RoundBatchRow;
  quantity?: string;
  cause?: string;
  sample_size?: string;
  average_weight_g?: string;
  /** A rate for this line alone, when it differs from the record's. */
  rate?: string;
  /** For a harvest: how much of the product these animals gave. */
  product_quantity?: string;
}
