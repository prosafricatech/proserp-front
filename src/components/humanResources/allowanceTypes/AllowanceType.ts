export interface AllowanceType {
  id: number;
  name: string;
  code?: string;
  is_taxable: boolean;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
