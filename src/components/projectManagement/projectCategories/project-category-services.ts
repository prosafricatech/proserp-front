import axios from '@/lib/services/config';
import {
  AddCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
  PaginatedCategoryResponse,
} from './ProjectCategoriesType';

const projectCategoryServices: any = {};

projectCategoryServices.getList = async (
  params: { keyword?: string; page?: number; limit?: number } = {}
): Promise<PaginatedCategoryResponse> => {
  const { page = 1, limit = 10, ...queryParams } = params;
  const { data } = await axios.get('/api/projectManagement/projectCategories', {
    params: { page, limit, ...queryParams },
  });
  return data;
};

projectCategoryServices.getAll = async (): Promise<{ id: number; name: string }[]> => {
  const response = await axios.get('/api/projectManagement/projectCategories/all_category');
  return response.data.data; // <- important
};

projectCategoryServices.add = async (category: { name: string; description?: string }) => {
  await axios.get('/sanctum/csrf-cookie').then(async (response) => {
  const { data } = await axios.post('/api/projectManagement/projectCategories/add', category);
  return data;
  });
};

projectCategoryServices.update = async (
  category: { id: number; name: string; description?: string }
): Promise<UpdateCategoryResponse> => {
  return await axios.get('/sanctum/csrf-cookie').then(async () => {
    const { data } = await axios.put(
      `/api/projectManagement/projectCategories/${category.id}/update`,
      category
    );
    return data;
  });
};

projectCategoryServices.delete = async (
  params: { id: number }
): Promise<DeleteCategoryResponse> => {
  return await axios.get('/sanctum/csrf-cookie').then(async () => {
    const { data } = await axios.delete(
      `/api/projectManagement/projectCategories/${params.id}/delete`
    );
    return data;
  });
};


export default projectCategoryServices;
export type {
  AddCategoryResponse,
  UpdateCategoryResponse,
  DeleteCategoryResponse,
  PaginatedCategoryResponse, 
} 
