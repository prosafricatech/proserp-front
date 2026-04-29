import { useQuery } from '@tanstack/react-query';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';

type LeaveAllocation = {
  leave_type_id?: number;
  allocated_days?: number;
  used_days?: number;
  remaining_days?: number;
};

const extractList = (payload: any): LeaveAllocation[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export default function useLeaveAllocationBalance(employeeId?: number, leaveTypeId?: number, year?: number) {
  return useQuery({
    queryKey: ['leave-allocation-balance', employeeId, leaveTypeId, year],
    enabled: Boolean(employeeId && year),
    queryFn: async () => {
      const response = await humanResourcesServices.getLeaveAllocationsList({
        employee_id: employeeId,
        year,
        page: 1,
        limit: 200,
      });
      const allocations = extractList(response);
      if (!leaveTypeId) return null;

      const matched = allocations.find((item) => Number(item.leave_type_id) === Number(leaveTypeId));
      if (!matched) return null;

      const allocated = Number(matched.allocated_days || 0);
      const used = Number(matched.used_days || 0);
      const remaining = matched.remaining_days != null ? Number(matched.remaining_days) : allocated - used;

      return {
        allocated,
        used,
        remaining,
      };
    },
    staleTime: 1000 * 60,
  });
}
