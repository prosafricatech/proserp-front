import EmployeeBankAccounts from '@/components/humanResources/employeeBankAccounts/EmployeeBankAccounts';
import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';

const page = () => {
  return (
    <EmployeesProvider>
      <EmployeeBankAccounts />
    </EmployeesProvider>
  );
};

export default page;