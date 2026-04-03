export interface TaxReliefType {
  id: number;
  name: string;
  amount: number;
  is_active: boolean;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
