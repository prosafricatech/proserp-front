export type Category = {
  id?: number;
  name: string;
  description?: string;
}
export type AddCategoryResponse = {
  message: string;
  data?: Category;
}
export type UpdateCategoryResponse = {
  message: string;
  data?: Category;
}
export type DeleteCategoryResponse = {
  message: string;
}
export type PaginatedCategoryResponse = {
  data: Category[];
  current_page: number;
  total: number;
  last_page: number;
} 
export interface ProjectCategory {
  id: number;
  name: string;
  description?: string;
}
