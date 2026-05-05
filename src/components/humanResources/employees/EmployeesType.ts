export interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  national_id: string;
  passport_number?: string;
  photo_path?: string;
  department_id?: number;
  employment_type?: string;
  join_date?: string;
  user_id: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  department: {
    id: number;
    name: string;
    code: string;
  };
  active_contract: {
    id: number;
    basic_salary: number;
    contract_type: string;
    status: string;
    designation: {
      id: number;
      title: string;
    };
  };
}
