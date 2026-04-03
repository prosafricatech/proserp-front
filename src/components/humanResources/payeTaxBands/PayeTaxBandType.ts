export interface PayeTaxBandType {
  id: number;
  min_income: number;
  max_income?: number | null;
  rate_percent: number;
  fixed_amount?: number | null;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
