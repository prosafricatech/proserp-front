export interface NextOfKinType {
  id: number;
  employee_id: number;
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  address?: string;
  is_primary: boolean;
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
}
