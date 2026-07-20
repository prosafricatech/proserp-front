import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

export type LoanRequestStatus =
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface LoanRequest {
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
  cost_center: CostCenter | null;
  // shape unconfirmed — null in this sample, so left loose on purpose
  deduction_type: Record<string, any> | null;
}

export interface LoanRequestsListResponse {
  data: LoanRequest[];
  current_page: number;
  per_page: number;
  total: number;
}
