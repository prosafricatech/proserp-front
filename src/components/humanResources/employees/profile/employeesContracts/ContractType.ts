export interface ContractType {
  id: number;
  employee_id?: number;
  designation_id?: number;
  contract_type: string;
  start_date: string;
  end_date?: string;
  probation_end_date: string;
  basic_salary: number;
  status: string;
  remarks?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  employee: { id: number; first_name: string; last_name: string };
  designation: { id: number; title: string; code: string };
}
