import axios from '@/lib/services/config';

export type ProsAuditQueryParams = {
  page?: number;
  limit?: number;
  keyword?: string;
  from?: string;
  to?: string;
  request_id?: string;
  event?: string;
  resource?: string;
  user_id?: string | number;
  organization_id?: string | number;
};

const toEndOfDay = (date?: string) => {
  if (!date) return undefined;
  return `${date} 23:59:59`;
};

const buildParams = (params: ProsAuditQueryParams = {}) => {
  const built = {
    ...params,
    to: toEndOfDay(params.to),
  } as Record<string, string | number | undefined>;

  Object.keys(built).forEach((key) => {
    if (built[key] === '' || built[key] === undefined || built[key] === null) {
      delete built[key];
    }
  });

  return built;
};

const prosAuditServices = {
  getList: async (params: ProsAuditQueryParams = {}) => {
    const { data } = await axios.get('/api/prosControl/audits', {
      params: buildParams(params),
    });
    return data;
  },

  getOrganizations: async () => {
    const { data } = await axios.get('/api/prosControl/audits/organizations');
    return data;
  },

  getOrganizationTrail: async (
    organizationId: string | number,
    params: ProsAuditQueryParams = {}
  ) => {
    const { data } = await axios.get(
      `/api/prosControl/audits/organizations/${organizationId}`,
      { params: buildParams(params) }
    );
    return data;
  },

  getRequestTrail: async (requestId: string) => {
    const { data } = await axios.get(`/api/prosControl/audits/request/${requestId}`);
    return data;
  },

  getOne: async (id: string | number) => {
    const { data } = await axios.get(`/api/prosControl/audits/${id}`);
    return data;
  },
};

export default prosAuditServices;
