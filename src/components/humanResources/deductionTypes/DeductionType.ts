export interface DeductionType {
  id: number;
  name: string;
  code?: string;
  category: 'statutory' | 'voluntary';
  computation_method:
    | 'fixed'
    | 'percentage_of_basic'
    | 'percentage_of_gross';
  default_value: number;
  is_pre_tax: boolean;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
