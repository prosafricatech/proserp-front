interface CostCenterable {
  id: number;
  name: string;
  address?: string | null;
  status: string;
  type: string;
}

interface User {
  id: number;
  name: string;
  [key: string]: any;
}

export interface CostCenter {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  type: string;
  created_by?: number;
  cost_centerable_id?: number;
  cost_centerable?: CostCenterable;
  users?: User[];
}