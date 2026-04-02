import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';
import NextOfKins from '@/components/humanResources/nextOfKins/NextOfKins';

const page = () => {
  return (
    <EmployeesProvider>
      <NextOfKins />
    </EmployeesProvider>
  );
};

export default page;