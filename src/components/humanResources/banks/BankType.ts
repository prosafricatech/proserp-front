export interface BankType {
  id: number;
  name: string;
  short_name?: string | null;
  swift_code?: string | null;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}
