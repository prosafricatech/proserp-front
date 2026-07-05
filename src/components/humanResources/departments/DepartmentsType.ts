export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  created_by: number;
  salary_expense_ledger_id?: number | null;
  created_at?: string;
  updated_at?: string;
}
