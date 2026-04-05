export interface LeaveAllocationType {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  allocated_days: number;
  used_days?: number;
  remaining_days?: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    employee_number?: string;
  };
  leave_type?: {
    id: number;
    name: string;
    days_per_year?: number;
  };
}
