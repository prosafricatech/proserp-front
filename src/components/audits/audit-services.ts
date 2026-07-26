import axios from '@/lib/services/config';

export type AuditQueryParams = {
  page?: number;
  limit?: number;
  keyword?: string;
  from?: string;
  to?: string;
  request_id?: string;
  action?: string;
  resource?: string;
  actor_id?: string | number;
};

const toEndOfDay = (date?: string) => {
  if (!date) return undefined;
  return `${date} 23:59:59`;
};

const buildParams = (params: AuditQueryParams = {}) => {
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

const auditServices = {
  getList: async (params: AuditQueryParams = {}) => {
    const { data } = await axios.get('/api/audits', {
      params: buildParams(params),
    });
    return data;
  },

  getFilterOptions: async () => {
    const { data } = await axios.get('/api/audits/filter-options');
    return data;
  },

  getHistory: async (
    resource: string,
    id: string | number,
    params: AuditQueryParams = {}
  ) => {
    const { data } = await axios.get(`/api/audits/history/${resource}/${id}`, {
      params: buildParams(params),
    });
    return data;
  },

  getRequestTrail: async (
    requestId: string,
    params: AuditQueryParams = {}
  ) => {
    const { data } = await axios.get(`/api/audits/request/${requestId}`, {
      params: buildParams(params),
    });
    return data;
  },

  getOne: async (id: string | number, options: { core?: boolean } = {}) => {
    const { data } = await axios.get(`/api/audits/${id}`, {
      params: options.core ? { core: 1 } : undefined,
    });
    return data;
  },

  getAuthTrail: async (params: AuditQueryParams = {}) => {
    const { data } = await axios.get('/api/audits/auth-trail', {
      params: buildParams(params),
    });
    return data;
  },
};

export default auditServices;
