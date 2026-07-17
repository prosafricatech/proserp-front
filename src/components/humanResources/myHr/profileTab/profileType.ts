import { Employee } from '../../employees/EmployeesType';

export type MyHrProfileType = Omit<Employee, 'active_contract'> & {
  active_contract: ActiveContract | null;
  primary_bank_account: PrimaryBankAccount | null;
};

type ActiveContract = {
  id: number;
  employee_id: number;
  designation_id: number;
  contract_type: string;
  start_date: string;
  end_date: string | null;
  probation_end_date: string | null;
  basic_salary: number;
  status: string;
  remarks: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  designation: Designation;
};

type Designation = {
  id: number;
  title: string;
  code: string | null;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type PrimaryBankAccount = {
  id: number;
  bank_id?: number;
  bank?: {
    id: number;
    name: string;
    short_name?: string;
    swift_code?: string;
  };
  bank_name?: string;
  branch?: string;
  account_number: string;
  account_name: string;
  swift_code?: string;
  is_primary?: boolean;
};
