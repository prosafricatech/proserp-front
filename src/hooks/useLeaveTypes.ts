import { useQuery } from '@tanstack/react-query';
import humanResourcesServices from '@/components/humanResources/humanResourcesServices';

export type LeaveTypeOption = {
  id: number;
  name: string;
};

const extractList = (payload: any): LeaveTypeOption[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

export default function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types-for-requisitions'],
    queryFn: async () => {
      const response = await humanResourcesServices.getLeaveTypesList({ page: 1, limit: 500 });
      return extractList(response);
    },
    staleTime: 1000 * 60,
  });
}
