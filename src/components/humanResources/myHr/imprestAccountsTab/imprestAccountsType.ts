export interface MyHrImprestLedgerLink {
  id: number;
  user_id: number;
  ledger_id: number;
  type: string;
  created_at: string;
  updated_at: string;
  ledger: {
    id: number;
    name: string;
  };
}
