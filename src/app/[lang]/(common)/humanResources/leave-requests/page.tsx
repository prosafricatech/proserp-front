import { EmployeesProvider } from '@/components/humanResources/employees/EmployeesProvider';
import LeaveRequests from '@/components/humanResources/leaveRequests/LeaveRequests';

const page = () => {
  return (
    <EmployeesProvider>
      <LeaveRequests />
    </EmployeesProvider>
  );
};

export default page;
