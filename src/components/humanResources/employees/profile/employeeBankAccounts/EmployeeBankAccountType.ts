export interface EmployeeBankAccountType {
  id: number;
  employee_id: number;
  employee?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
  };
  bank_name: string;
  branch?: string;
  account_number: string;
  account_name: string;
  swift_code?: string;
  is_primary: boolean;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}
