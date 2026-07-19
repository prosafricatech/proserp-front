export interface MyHrAccountStatementTransaction {
  transactionDate: string;
  description: string;
  voucherNo: string | null;
  reference: string | null;
  credit: number;
  debit: number;
}

export interface MyHrAccountStatementResponse {
  filters: {
    from: string | null;
    to: string | null;
    cost_centers: 'all' | Array<{ id: number; name: string }>;
    ledger: {
      id: number;
      name: string;
      code: string | null;
    };
  };
  timezone: string;
  organization_id: string;
  transactions: MyHrAccountStatementTransaction[];
}

export interface MyHrAccountStatementRow {
  transactionDate: string;
  reference: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number;
  isOpening?: boolean;
}
