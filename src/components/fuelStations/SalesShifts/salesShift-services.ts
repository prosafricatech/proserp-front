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

interface RqList {
  page?: number;
  limit?: number;
  keyword?: string;
  filters?: {
    stationId?: string;
    from?: string | null;
    to?: string | null;
    [key: string]: any;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Interfaces based on your JSON structure
interface ProductPrice {
  product_id: number;
  price: number | string;
}

interface PumpReading {
  pump_id: number;
  product_id: number;
  tank_id: number;
  opening: number;
  closing: number;
}

interface FuelVoucher {
  stakeholder_id: number | null;
  reference?: string;
  narration?: string;
  product_id: number;
  quantity: number;
  expense_ledger_id?: number;
}

interface LedgerEntry {
  id: number;
  amount: number;
}

interface CreateSalesShiftData {
  shift_team_id: number;
  shift_start: string;
  shift_end: string;
  submit_type: 'close' | 'draft'; // Based on your JSON
  product_prices: ProductPrice[];
  pump_readings: PumpReading[];
  fuel_vouchers: FuelVoucher[];
  main_ledger: LedgerEntry;
  other_ledgers: LedgerEntry[];
}

interface UpdateSalesShiftData extends Partial<CreateSalesShiftData> {
  id?: number;
}

interface PaginatedResponse {
  data: SalesShift[];
  total: number;
  current_page: number;
  last_page: number;
}

interface SalesShiftServices {
  getStationShifts: (params: { queryParams: QueryParams }) => Promise<PaginatedResponse>;
  getStationShiftsRq: (rqList: RqList) => Promise<PaginatedResponse>;
  createSalesShift: (data: CreateSalesShiftData) => Promise<any>;
  updateSalesShift: (id: number, data: UpdateSalesShiftData) => Promise<any>;
  deleteSalesShift: (id: number) => Promise<any>;
  getSalesShiftDetails: (id: number) => Promise<SalesShift>;
  closeSalesShift: (id: number) => Promise<any>;
}

const salesShiftServices: SalesShiftServices = {
  getStationShifts: async ({ queryParams }) => {
    const response = await axios.get('/api/fuelStations/salesShifts', {
      params: queryParams,
    });
    return response.data;
  },

  getStationShiftsRq: async (rqList: RqList) => {
    const params: any = {
      page: rqList.page || 1,
      limit: rqList.limit || 10,
      keyword: rqList.keyword || '',
    };

    if (rqList.filters) {
      if (rqList.filters.stationId) params.stationId = rqList.filters.stationId;
      if (rqList.filters.from) params.from = rqList.filters.from;
      if (rqList.filters.to) params.to = rqList.filters.to;
      
      if (rqList.filters) {
        Object.keys(rqList.filters).forEach(key => {
          if (!['stationId', 'from', 'to'].includes(key)) {
            params[key] = rqList.filters![key];
          }
        });
      }
    }

    if (rqList.sortBy) {
      params.sortBy = rqList.sortBy;
      params.sortOrder = rqList.sortOrder || 'asc';
    }

    const response = await axios.get('/api/fuelStations/salesShifts', {
      params,
    });
    return response.data;
  },

  createSalesShift: async (data: CreateSalesShiftData) => {
    await axios.get('/sanctum/csrf-cookie');
    
    // Prepare the data according to your JSON structure
    const requestData = {
      shift_team_id: data.shift_team_id,
      shift_start: data.shift_start,
      shift_end: data.shift_end,
      submit_type: data.submit_type,
      product_prices: data.product_prices.map(price => ({
        product_id: price.product_id,
        price: typeof price.price === 'string' ? parseFloat(price.price) : price.price
      })),
      pump_readings: data.pump_readings,
      fuel_vouchers: data.fuel_vouchers.map(voucher => ({
        stakeholder_id: voucher.stakeholder_id,
        reference: voucher.reference || null,
        narration: voucher.narration || null,
        product_id: voucher.product_id,
        quantity: voucher.quantity,
        ...(voucher.expense_ledger_id && { expense_ledger_id: voucher.expense_ledger_id })
      })),
      main_ledger: data.main_ledger,
      other_ledgers: data.other_ledgers
    };

    const response = await axios.post('/api/pos/sales-shift/add', requestData);
    return response.data;
  },

  updateSalesShift: async (id: number, data: UpdateSalesShiftData) => {
    await axios.get('/sanctum/csrf-cookie');
    
    // Prepare update data (only include provided fields)
    const requestData: any = {};
    
    if (data.shift_team_id !== undefined) requestData.shift_team_id = data.shift_team_id;
    if (data.shift_start !== undefined) requestData.shift_start = data.shift_start;
    if (data.shift_end !== undefined) requestData.shift_end = data.shift_end;
    if (data.submit_type !== undefined) requestData.submit_type = data.submit_type;
    if (data.product_prices !== undefined) requestData.product_prices = data.product_prices;
    if (data.pump_readings !== undefined) requestData.pump_readings = data.pump_readings;
    if (data.fuel_vouchers !== undefined) requestData.fuel_vouchers = data.fuel_vouchers;
    if (data.main_ledger !== undefined) requestData.main_ledger = data.main_ledger;
    if (data.other_ledgers !== undefined) requestData.other_ledgers = data.other_ledgers;

    const response = await axios.put(`/api/pos/sales-shift/${id}/update`, requestData);
    return response.data;
  },

  deleteSalesShift: async (id: number) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.delete(`/api/pos/sales-shift/${id}/delete`);
    return response.data;
  },

  getSalesShiftDetails: async (id: number) => {
    const response = await axios.get(`/api/pos/sales-shift/${id}/show`);
    return response.data;
  },

  closeSalesShift: async (id: number) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.post(`/api/pos/sales-shift/${id}/close`);
    return response.data;
  }
};

export default salesShiftServices;