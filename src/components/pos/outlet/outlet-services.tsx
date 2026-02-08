import axios from '@/lib/services/config';
import type {
  Outlet,
  AddOutletResponse,
  UpdateOutletResponse,
  DeleteOutletResponse,
  PaginatedOutletResponse,
} from './OutletType';

const outletServices: any = {}; 

outletServices.getList = async (params: { keyword?: string; page?: number; limit?: number } = {}): Promise<PaginatedOutletResponse> => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/pos/outlet', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

outletServices.getAllOutlets = async (): Promise<Outlet[]> => {
  const { data } = await axios.get('/api/pos/outlet/all_outlets');
  return data;
};

outletServices.add = async (outlet: Outlet): Promise<AddOutletResponse> => {
  return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
    const {data} = await axios.post(`/api/pos/outlet/add`,outlet)
    return data;
  })
};


outletServices.update = async(outlet:Outlet) => {
    return await axios.get('/sanctum/csrf-cookie').then(async (response) => {
        const {data} = await axios.put(`/api/pos/outlet/${outlet.id}]/update`,outlet)
        return data;
    })
};

outletServices.delete = async (params: { id: any; }): Promise<DeleteOutletResponse> => {
  await axios.get('/sanctum/csrf-cookie');
  const { data } = await axios.delete(`/api/pos/outlet/${params.id}/delete`);
  return data;
};

export default outletServices;
export type { Outlet, AddOutletResponse, UpdateOutletResponse, DeleteOutletResponse, PaginatedOutletResponse };