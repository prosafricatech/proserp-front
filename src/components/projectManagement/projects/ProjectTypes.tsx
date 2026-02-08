export interface Project {
  id?: number;
  name: string;
  project_category_id: number;
  client_id: number;
  store_ids: number[];
  reference?: string;
  description?: string;
  commencement_date?: string; // ISO date string
  completion_date?: string;   // ISO date string
}

export interface AddProjectResponse {
  message: string;
  data?: Project;
}

export interface UpdateProjectResponse {
  message: string;
  data?: Project;
}

export interface DeleteProjectResponse {
  message: string;
}

export interface PaginatedProjectResponse {
  data: Project[];
  current_page: number;
  total: number;
  last_page: number;
}

export interface ProjectSelectorProps {
  onChange: (value: Project | Project[] | null) => void;
  multiple?: boolean;
  label?: string;
  defaultValue?: number | null;
  frontError?: { message: string } | null;
}
