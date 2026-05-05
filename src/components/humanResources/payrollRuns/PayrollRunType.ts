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
    department?: {
      id?: number;
      name?: string;
    };
  };
  contract?: {
    id: number;
    basic_salary?: number;
    designation?: {
      id?: number;
      title?: string;
    };
  };
  allowances?: Array<{
    id?: number;
    allowance_type_id?: number;
    label?: string;
    amount?: number | string;
    value?: number | string;
    allowance_type?: {
      id?: number;
      name?: string;
    };
  }>;
  deductions?: Array<{
    id?: number;
    deduction_type_id?: number;
    label?: string;
    category?: string;
    is_pre_tax?: boolean;
    amount?: number | string;
    value?: number | string;
    deduction_type?: {
      id?: number;
      name?: string;
      category?: string;
      is_pre_tax?: boolean;
    };
  }>;
  employer_contributions?: Array<{
    id?: number;
    employer_contribution_type_id?: number;
    label?: string;
    category?: string;
    amount?: number | string;
    value?: number | string;
    contribution_type?: {
      id?: number;
      name?: string;
      category?: string;
    };
  }>;
}
