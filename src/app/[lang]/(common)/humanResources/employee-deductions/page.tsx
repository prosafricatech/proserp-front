import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';
import EmployeeDeductions from '@/components/humanResources/employeeDeductions/EmployeeDeductions';

const page = () => {
  return (
    <EmployeesProvider>
      <EmployeeDeductions />
    </EmployeesProvider>
  );
};

export default page;
