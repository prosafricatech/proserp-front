export interface PayrollPeriodType {
  id: number;
  year: number;
  month: number;
  monthName?: string;
  status: string;
  remarks: string;
  runs_count?: number;
  created_at?: string;
  updated_at?: string;
}

// PayrollAdjustmentType.ts
export interface AdjustmentEmployee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
}

export interface AllowanceType {
  id: number;
  name: string;
}

export interface DeductionType {
  id: number;
  name: string;
}

export interface PeriodAllowance {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  allowance_type_id: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  allowanceType: AllowanceType;
}

export interface PeriodDeduction {
  id: number;
  payroll_period_id: number;
  employee_id: number;
  deduction_type_id: number;
  amount: number;
  remarks: string | null;
  employee: AdjustmentEmployee;
  deductionType: DeductionType;
}

export interface PeriodAdjustments {
  allowances: PeriodAllowance[];
  deductions: PeriodDeduction[];
}

export interface ImportAdjustmentsResponse {
  message: string;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}