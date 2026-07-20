import { DeductionType } from '@/components/humanResources/deductionTypes/DeductionType';
import { Employee } from '@/components/humanResources/employees/EmployeesType';
import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

export type LoanRequestStatus =
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface LoanRequestApprovalChainLevel {
  id: number;
  approval_chain_id: number;
  role_id: number;
  position_index: number;
  label?: string | null;
  can_override: number;
  can_finalize: number;
  remarks?: string | null;
  status: 'active' | 'inactive';
  role?: {
    id: number;
    name: string;
  };
}

export interface LoanRequestApprovalChain {
  id: number;
  process_type: string; // "LOAN"
  cost_center_id?: number | null;
  remarks?: string | null;
  status: 'active' | 'inactive';
  levels?: LoanRequestApprovalChainLevel[];
}

export interface LoanRequestApproval {
  id?: number;
  loan_request_id?: number;
  chain_level_id?: number;
  approval_chain_level_id?: number;
  status?: 'approved' | 'rejected' | 'on hold' | string;
  status_label?: string;
  amount_approved?: number | null;
  installments_approved?: number | null;
  remarks?: string | null;
  approval_date?: string | null;
  creator?: {
    id?: number;
    name?: string;
  };
}

export interface LoanRequestPayment {
  id: number;
  voucher_no: string;
}

export interface LoanRequestType {
  id: number;
  employee_id: number;
  cost_center_id: number | null;
  approval_chain_id: number | null;
  amount: number;
  installments: number;
  amount_approved: number | null;
  installments_approved: number | null;
  installment_amount: number | null;
  reason: string | null;
  status: LoanRequestStatus;
  deduction_type_id: number | null;
  employee_deduction_id: number | null;
  reviewed_by: number | null;
  review_remarks: string | null;
  reviewed_at: string | null;
  payment_id: number | null;
  disbursed_at: string | null;
  disbursed_by: number | null;
  disbursement_reference: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee?: Employee;
  cost_center?: CostCenter | null;
  deduction_type?: DeductionType | null;
  payment?: LoanRequestPayment | null;
  approval_chain?: LoanRequestApprovalChain | null;
  approvals?: LoanRequestApproval[];
}
