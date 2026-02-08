export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  organizations?: {
    id: number;
    name: string;
    logo_path?: string;
  }[];
  status: 'active' | 'inactive';
  created_at?: string;
};

export type PaginatedUserResponse ={
  message:string;
}

export type DeactivateUserResponse = {
  message: string;
};

export type ReactivateUserResponse = {
  message: string;
};

export interface VerifyUserResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

 export interface ErrorResponse {
  message: string;
}
 