export interface MyHrPayslipListItem {
  id: number;
  payroll_run_id: number;
  employee_id: number;
  employee_contract_id: number;
  basic_salary: number;
  paye: number;
  paid_amount: number;
  balance_remaining: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  contract: PayslipContract;
  run: PayslipRun;
}

interface PayslipContract {
  id: number;
  employee_id: number;
  designation_id: number;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  basic_salary: number;
  status: string;
  remarks: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  designation: {
    id: number;
    title: string;
    code: string | null;
    description: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

interface PayslipRun {
  id: number;
  payroll_period_id: number;
  cost_center_id: number | null;
  approval_chain_id: number | null;
  status: string;
  status_label: string;
  fallback_payable_ledger_id: number | null;
  journal_voucher_id: number | null;
  remarks: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  period: {
    id: number;
    year: number;
    month: number;
    remarks: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export type MyHrPayslipDetail = Record<string, unknown>;
