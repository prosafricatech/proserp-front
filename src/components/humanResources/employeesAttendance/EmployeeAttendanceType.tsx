export type EmployeeAttendanceType = {
  id: number;
  employee_id: number;
  date: string;
  type: string;
  hours_worked: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee: {
    id: number;
    employee_number: string;
    first_name: string;
    last_name: string;
  };
};
