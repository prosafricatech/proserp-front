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
