import { CostCenter } from "@/components/masters/costCenters/CostCenterType";
import { Currency } from "@/components/masters/Currencies/CurrencyType";
import { User } from "@/types/auth-types";

interface Role {
  id: number;
  name: string;
}

export interface ApprovalChainLevel {
  id: number;
  approval_chain_id: number;
  role_id: number;
  is_final: number;
  position_index: number;
  label: string;
  can_override: number;
  can_finalize: number;
  remarks: string | null;
  role: Role;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  deleted_at: string | null;
}

export interface RequisitionSummary {
  id: number;
  requisitionNo: string;
  requisition_date: string;
  cost_center: CostCenter;
  creator: User;
  status_label: string;
  vat_amount: number;
}

export interface BaseApprovalRequisition {
  id: number;
  amount: number;
  vat_amount: number;
  approval_date: string;
  creator: User;
  currency: Currency;
  process_type: "PURCHASE" | "PAYMENT";
  remarks: string | null;
  status_label?: string;
  requisition: RequisitionSummary;
  next_approval_level?: ApprovalChainLevel | null;
}

export interface PaymentApprovalRequisition extends BaseApprovalRequisition {
  process_type: "PAYMENT";
  is_fully_paid: boolean;
  payments_count: number;
}

export interface PurchaseApprovalRequisition extends BaseApprovalRequisition {
  process_type: "PURCHASE";
  is_fully_ordered: boolean;
  purchase_orders_count: number;
}

export type ApprovalRequisition = PaymentApprovalRequisition | PurchaseApprovalRequisition;
export type ApprovalRequisitionList = ApprovalRequisition[];

// Corrected utility types
export type RequisitionProcessType = BaseApprovalRequisition['process_type'];
export type RequisitionAmount = {
  amount: number;
  vat_amount: number;
};

// Helper type to extract amount info from a requisition
export const getRequisitionAmount = (req: ApprovalRequisition): RequisitionAmount => ({
  amount: req.amount,
  vat_amount: req.requisition.vat_amount
});