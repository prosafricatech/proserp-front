import { Ledger } from "@/components/accounts/ledgers/LedgerType";
import { User } from "@/components/prosControl/userManagement/UserManagementType";
import { FuelPump } from "../Stations/StationType";


export interface Tank {
  id: number;
  name: string;
  alias: string | null;
  description: string | null;
}

export interface TankReading {
  id: number;
  tank: Tank;
  product?: Product | null;
  reading?: number;
  deviation?: number;
}

export interface Station {
  id: number;
  name: string;
  address: string | null;
}

export interface Dipping {
  id: number;
  fuel_station_id?: number; 
  station?: Station;            
  as_at: string;                 
  remarks: string;
  dipping_no?: string | number;
  readings: TankReading[];
}

export interface DippingsPaginatedResponse {
  current_page: number;
  data: Dipping[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface DippingsProps {
  activeStation?: Station | null;
}
export interface Station {
  id: number;
  name: string;
  address: string | null;
  shift_teams?: any[]; // You can type this better if needed
  fuel_pumps?: any[];
}
export interface Product {
  id: number;
  name: string;
  productOptions?: any[];
  // add other fields if needed
}
export interface Organization {
  id: number;
  name: string;
  logo_path?: string | null;
  settings?: {
    main_color?: string;
    light_color?: string;
    contrast_text?: string;
  };
}
export interface DippingDetails {
  id: number;
  as_at: string;                    // ISO string
  remarks: string;
  station?: Station;
  creator?: User;
  readings: TankReading[];
}
export interface ShiftTeam {
  id: number;
  name: string;
  description?: string;
  ledger_ids: number[];
  ledgers: Ledger[];
}
export interface PumpReading {
  pump_id: number;
  product_id: number;
  tank_id: number;
  opening: number;
  closing: number;
  pump?: FuelPump;
  product?: Product;
}