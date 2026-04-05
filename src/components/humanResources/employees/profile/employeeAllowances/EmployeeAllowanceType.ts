export interface EmployeeAllowanceType {
  id: number;
  employee_id: number;
  allowance_type_id: number;
  amount: number;
  effective_from: string;
  effective_to?: string | null;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    employee_number?: string;
  };
  allowance_type?: {
    id: number;
    name: string;
    code?: string;
    is_taxable?: boolean;
  };
}
