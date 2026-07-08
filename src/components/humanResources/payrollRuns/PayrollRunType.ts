export interface PayrollRunType {
  id: number;
  payroll_period_id: number;
  cost_center_id?: number | null;
  employee_id: number;
  employee_contract_id: number;
  basic_salary: number;
  gross_salary?: number;
  paye: number;
  total_allowances?: number;
  total_deductions?: number;
  payslip_count?: number;
  employee_count?: number;
  net_salary?: number;
  requires_approval?: boolean;
  payroll_period?: {
    id: number;
    name?: string;
    month?: number;
    year?: number;
    start_date?: string;
    end_date?: string;
  };
  approval_chain_id?: number | null;
  status?: string;
  status_label?: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  designation?: string;
  cost_center?: {
    id?: number;
    name?: string;
  } | null;
  journal_voucher?: {
    id?: number;
    voucher_no?: string;
  };
  payment?: {
    id?: number;
    voucher_no?: string;
  };
  approval_chain?: {
    id?: number;
    levels?: Array<{
      id: number;
      name?: string;
      level_name?: string;
      level?: number;
      status?: string;
    }>;
  } | null;
  approvals?: Array<{
    id?: number;
    chain_level_id?: number;
    approval_chain_level_id?: number;
    status?: string;
    remarks?: string;
    approval_date?: string;
  }>;
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
