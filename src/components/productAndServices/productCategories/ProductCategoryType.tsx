import { Ledger } from "@/components/accounts/ledgers/LedgerType";

export type ProductCategory = {
  id: number;
  name: string;
  parent_id: number | null;
  description: string;
  income_ledger_id: number | null;
  expense_ledger_id: number | null;
  income_ledger?: Ledger;
  expense_ledger?: Ledger;
  parent?: ProductCategory | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: number;
};
export type productCategoryOption = {
  id: number;
  name: string;
};
export interface ProductCategoryFormData {
  id?: number;
  name: string;
  parent_id: number | null;
  description: string;
  income_ledger_id: number;
  expense_ledger_id: number;
}
