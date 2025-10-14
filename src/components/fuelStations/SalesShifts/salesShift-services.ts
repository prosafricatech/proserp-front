import axios from "@/lib/services/config";
import { SalesShift } from "./SalesShiftType";

interface QueryParams {
  stationId?: string;
  keyword?: string;
  from?: string | null;
  to?: string | null;
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: SalesShift[];
  total: number;
  current_page: number;
  last_page: number;
}

interface SalesShiftServices {
  getStationShifts: (params: { queryParams: QueryParams }) => Promise<PaginatedResponse>;
  createSalesShift: (data: any) => Promise<any>;
  updateSalesShift: (id: number, data: any) => Promise<any>;
  deleteSalesShift: (id: number) => Promise<any>;
  getSalesShiftDetails: (id: number) => Promise<SalesShift>;
  closeSalesShift: (id: number) => Promise<any>;
}

const salesShiftServices: SalesShiftServices = {
  getStationShifts: async ({ queryParams }) => {
    const response = await axios.get('/api/pos/sales-shift', {
      params: queryParams,
    });
    return response.data;
  },

  createSalesShift: async (data) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.post('/api/pos/sales-shift/add', data);
    return response.data;
  },

  updateSalesShift: async (id, data) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.put(`/api/pos/sales-shift/${id}/update`, data);
    return response.data;
  },

  deleteSalesShift: async (id) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.delete(`/api/pos/sales-shift/${id}/delete`);
    return response.data;
  },

  getSalesShiftDetails: async (id) => {
    const response = await axios.get(`/api/pos/sales-shift/${id}/show`);
    return response.data;
  },

  closeSalesShift: async (id) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.post(`/api/pos/sales-shift/${id}/close`);
    return response.data;
  }
};

export default salesShiftServices;
