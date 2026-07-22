import { CostCenter } from '@/components/masters/costCenters/CostCenterType';

type EmployeesType = {
  employee_id: 4;
  employee_number: null;
  name: string;
  bank_name: null;
  branch: null;
  account_number: null;
  account_name: null;
  net_salary: 644000;
};
export type salarySheetType = {
  run: {
    id: 1;
    status: string;
    period: {
      year: number;
      month: number;
    };
    cost_center?: CostCenter;
  };
  rows: [{}];
  total_net_salary: 5010000;
  total_employees: 4;
  employees_without_bank_account: 4;
  zero_pay_employees: [];
};
