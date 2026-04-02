import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';
import EmployeeAllowances from '@/components/humanResources/employeeAllowances/EmployeeAllowances';

const page = () => {
  return (
    <EmployeesProvider>
      <EmployeeAllowances />
    </EmployeesProvider>
  );
};

export default page;
