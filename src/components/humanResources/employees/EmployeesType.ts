export interface Employee {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  email: string;
  phone_number: string;
  address: string;
  date_of_birth: string;
  user_id: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}
