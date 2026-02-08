export interface User {
  id: number;
  name: string;
  email?: string;
  // Add other user properties as needed
}

export interface Store {
  id: number;
  name: string;
  alias?: string;
  description?: string;
  parent_id?: number | null;
  users?: User[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  // Add other store properties as needed
}

export interface StoreOption {
  id: number;
  name: string;
}

export interface StoreFormData {
  id?: number;
  name: string;
  alias?: string;
  description?: string;
  parent_id?: number | null;
  user_ids?: number[];
}

export interface MenuItem {
  icon: React.ReactNode;
  title: string;
  action: string;
}