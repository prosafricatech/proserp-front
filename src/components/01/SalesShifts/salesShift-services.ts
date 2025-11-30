import axios from "@/lib/services/config";
import { AddSalesShiftResponse, PaginatedSalesShiftResponse, SalesShift } from "./SalesShiftType";


const  salesShiftServices: any = {};

  salesShiftServices.getList = async (params: { keyword?: string; page?: number; limit?: number } = {}): Promise<PaginatedSalesShiftResponse> => {
    const { page = 1, limit = 10, ...queryParams } = params;
    const { data } = await axios.get('/api/fuelStations/salesShifts', {
      params: { page, limit, ...queryParams },
    });
    return data;
  };

  salesShiftServices.add = async (salesShifts:SalesShift): Promise<AddSalesShiftResponse> => {
  return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
    const {data} = await axios.post(`/api/fuelStations/salesShifts/add`,SalesShifts)
    return data;
  })
};
 
export default salesShiftServices;
    
     
