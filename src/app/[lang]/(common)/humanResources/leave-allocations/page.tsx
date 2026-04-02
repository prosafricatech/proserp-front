import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';
import LeaveAllocations from '@/components/humanResources/leaveAllocations/LeaveAllocations';

const page = () => {
  return (
    <EmployeesProvider>
      <LeaveAllocations />
    </EmployeesProvider>
  );
};

export default page;
