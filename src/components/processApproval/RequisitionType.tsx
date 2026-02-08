import { User } from "@/types/auth-types";
import { Product } from "../productAndServices/products/ProductType";
import { MeasurementUnit } from "../masters/measurementUnits/MeasurementUnitType";
import { CostCenter } from "../masters/costCenters/CostCenterType";
import { Currency } from "../masters/Currencies/CurrencyType";
import { Ledger } from "../accounts/ledgers/LedgerType";
import { Stakeholder } from "../masters/stakeholders/StakeholderType";

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

export interface Approval {
  id: number;
  approval_chain_level_id: number;
  items: RequisitionItem[];
  requisition?: Requisition;
  approval_date: string;
  amount: number;
  has_orders?: boolean;
  approval_chain_level: ApprovalChainLevel;
  creator: User;
  has_payments: boolean;
  is_final: number;
  remarks: string | null;
  status: string;
  status_label: string;
  vat_amount: number;
  narration?: string;
}

export interface ApprovalChain {
  id: number;
  process_type: "PURCHASE" | "PAYMENT";
  cost_center_id: number;
}

export interface RelatableTransaction {
  id: number;
  relatableNo: string;
  order_date: string;
  total_amount: number;
  currency?: {
    code: string;
  };
  unapproved_amount: number;
  [key: string]: any;
}

export interface RequisitionLedgerItem {
  ledger_id?: number;
  ledger?: Ledger;
  quantity?: number;
  rate?: number;
  amount?: number;
  relatable_type?: string | null;
  relatable?: RelatableTransaction | null;
  relatable_id?: number | null;
  measurement_unit_id?: number;
  measurement_unit?: MeasurementUnit;
  unit_symbol?: string;
  remarks?: string;
  [key: string]: any;
}

export interface Vendor {
  id: number;
  stakeholder_id?: number;
  stakeholder?: Stakeholder;
  remarks?: string;
  name: string;
}

export interface PurchaseItem {
  id: number;
  product: Product;
  quantity: number;
  relatableNo?: string;
  rate: number;
  measurement_unit: MeasurementUnit;
  remarks: string | null;
  vat_percentage?: number;
  vendors?: Vendor[];
  [key: string]: any;
}

export interface Relatable {
  id: number;
  orderNo: string;
  order_date: string;
}

export interface PaymentItem {
  id: number;
  ledger: Ledger;
  quantity: number;
  rate: number;
  measurement_unit: MeasurementUnit;
  relatable: Relatable | null;
  relatableNo?: string;
  relatable_id: number | null;
  relatable_type: string | null;
  remarks: string | null;
  vat_percentage?: number;
  vendors?: Vendor[];
  [key: string]: any;
}

export interface BaseRequisition {
  id: number;
  requisitionNo: string;
  requisition_date: string;
  amount: number;
  vat_amount: number;
  approval_chain: ApprovalChain;
  approvals: Approval[];
  approvals_count: number;
  attachments: any[];
  attachments_count: number;
  cost_center: CostCenter;
  creator: User;
  currency: Currency;
  next_approval_level: ApprovalChainLevel | null;
  process_type: "PURCHASE" | "PAYMENT";
  reference: string | null;
  remarks: string | null;
  status: string;
  status_label: string;
}

export interface PurchaseRequisition extends BaseRequisition {
  process_type: "PURCHASE";
  items: PurchaseItem[];
  is_fully_ordered: boolean;
}

export interface PaymentRequisition extends BaseRequisition {
  process_type: "PAYMENT";
  items: PaymentItem[];
  is_fully_paid: boolean;
}

export type Requisition = PurchaseRequisition | PaymentRequisition;
export type RequisitionItem = PurchaseItem | PaymentItem;

// For the list of requisitions
export type RequisitionList = Requisition[];