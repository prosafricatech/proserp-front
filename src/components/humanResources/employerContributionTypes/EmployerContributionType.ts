export interface EmployerContributionType {
  id: number;
  name: string;
  code?: string;
  category: 'statutory' | 'voluntary';
  computation_method:
    | 'fixed'
    | 'percentage_of_basic'
    | 'percentage_of_gross';
  default_value: number;
  description?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
