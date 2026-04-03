export interface PayeTaxBandType {
  id: number;
  country_code: string;
  region?: string | null;
  min_income: number;
  max_income?: number | null;
  rate: number;
  fixed_tax: number;
  excess_over: number;
  effective_from: string;
  effective_to?: string | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
