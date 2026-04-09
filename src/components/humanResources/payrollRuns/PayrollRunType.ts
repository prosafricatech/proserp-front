export interface PayrollRunType {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  employee_contract_id: number;
  basic_salary: number;
  paye: number;
  status?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: number;
    first_name?: string;
    last_name?: string;
    employee_number?: string;
  };
  contract?: {
    id: number;
    basic_salary?: number;
    designation?: {
      id?: number;
      title?: string;
    };
  };
}
