import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { FuelPump } from '../Stations/StationType';
import { User } from '@/types/auth-types';
import { PaginatedUserResponse } from '@/components/prosControl/userManagement/UserManagementType';
import { JumboRqListProps } from '@jumbo/types/JumboRqListProps';
import { createContext } from 'react';

export interface ShiftTeam {
  id: number;
  name: string;
  description?: string;
  ledger_ids: number[];
  ledgers: Ledger[];
}

export interface ProductPrice {
  product_id: number;
  price: number;
  product?: Product;
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

export interface FuelVoucher {
  stakeholder_id?: number | null;
  reference?: string;
  narration?: string;
  product_id: number;
  quantity: number;
  expense_ledger_id?: number | null;
  stakeholder?: Stakeholder;
  product?: Product;
  expense_ledger?: Ledger;
}

export interface LedgerAmount {
  id: number;
  amount: number;
  ledger?: Ledger;
}

export interface Adjustments {
  id?: number;
  ledger_id?: number;
  amount?: number;
  narration?: string;
  ledger?: Ledger;
  quantity?: number;
  product_id?: number;
  product?: Product;
  operator?: string;
  tank_id?: number;
  operator_name: string;
  description?: string;
}

export interface SalesShift {
  id?: number;
  shift_team_id: number;
  shift_team?: ShiftTeam;
  shiftNo?: string;
  station_id?: number;
  station?: Station;
  shift_start: string;
  shift_end?: string | null;
  status?: 'open' | 'closed' | 'suspended' | 'draft';
  submit_type: 'open' | 'close' | 'suspend' | 'draft'; // Added 'suspend'
  product_prices: ProductPrice[];
  pump_readings: PumpReading[];
  fuel_vouchers: FuelVoucher[];
  main_ledger: LedgerAmount;
  main_ledger_id?: number; // Added from payload
  main_ledger_amount?: number; // Added from payload
  other_ledgers: LedgerAmount[];
  adjustments: Adjustment[]; // Changed from optional to required, fixed plural name
  opening_dipping: Dipping[]; // Added from payload
  closing_dipping: Dipping[]; // Added from payload
  dipping_before: Dipping[]; // Added from payload
  dipping_after: Dipping[]; // Added from payload
  isOpenSwitchON?: boolean; // Added from payload
  isCloseSwitchON?: boolean; // Added from payload
  created_at?: string;
  updated_at?: string;
  users?: User[]; // Made optional since not in payload
}

export interface Adjustment {
  tank_id?: number;
  quantity: number;
  operator: string;
  description?: string;
  product_id: number;
}







export interface ProductPrice {
  product_id: number;
  price: number;
}

export interface Tank {
  id: number | string;
  name: string;
  // add more if needed
}

export interface ShiftTeam {
  id: number;
  name: string;
  description?: string;
  ledger_ids: number[];
  ledgers: Ledger[];
}

export interface ProductPrice {
  product_id: number;
  price: number;
  product?: Product;
}

export interface PumpReading {
  pump_id: number;
  product_id: number;
  tank_id: number;
  opening: number;
  closing: number;
  fuel_pump_id?: number;
  pump?: FuelPump;
  product?: Product;
}

export interface FuelVoucher {
  stakeholder_id?: number | null;
  reference?: string;
  narration?: string;
  product_id: number;
  quantity: number;
  voucherNo?: string;
  expense_ledger_id?: number | null;
  stakeholder?: Stakeholder;
  product?: Product;
  expense_ledger?: Ledger;
  fuelVoucherData?: FuelVoucherData | null | undefined;
  clientName?: string;
}

export interface LedgerAmount {
  id: number;
  amount: number;
  ledger?: Ledger;
}

export interface ProductPrice {
  product_id: number;
  price: number;
  [key: string]: any;
}

export interface FuelVoucherData {
  id?: number;
  product_id?: number | null;
  quantity?: number;
  amount?: number;
  reference?: string | null;
  narration?: string | null;
  stakeholder?: Stakeholder | null;
  stakeholder_id?: number | null;
  expense_ledger?: Ledger | null;
  expense_ledger_id?: number | null;
  product?: Product | null;
}

export interface CreateSalesShiftData {
  shift_team_id: number;
  shift_start: string;
  shift_end: string;
  submit_type: 'close' | 'draft'; 
  product_prices: ProductPrice[];
  pump_readings: PumpReading[];
  fuel_vouchers: FuelVoucher[];
  main_ledger: Ledger;
  other_ledgers: Ledger[];
}

export interface UpdateSalesShiftData extends Partial<CreateSalesShiftData> {
  id?: number;
}

export interface SalesShiftServices {
  getStationShifts: (params: Station ) => Promise<PaginatedUserResponse>;
  getStationShiftsRq: (rqList: JumboRqListProps) => Promise<PaginatedUserResponse>;
  createSalesShift: (data: CreateSalesShiftData) => Promise<any>;
  updateSalesShift: (id: number, data: UpdateSalesShiftData) => Promise<any>;
  deleteSalesShift: (id: number) => Promise<any>;
  getSalesShiftDetails: (id: number) => Promise<SalesShift>;
  closeSalesShift: (id: number) => Promise<any>;
}

export interface AddSalesShiftResponse {
  message: string;
  data?: any; 
}

export interface DeleteSalesShiftResponse {
  message: string;
}

export interface UpdateSalesShiftResponse {
  message: string;
  data?: SalesShift;  
}

export interface PaginatedSalesShiftResponse {
  data: SalesShift[];
  current_page: number;
  total: number;
  last_page: number;
}

export interface AddSalesShifResponse {
  message: string;
  data?: any; 
}

export interface updateSalesShiftResponse {
  message: string;
  data?: SalesShift;
}

export interface deleteSalesShiftResponse {
  message: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: PaginatedLinks[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface PaginatedLinks {
  url: string | null;
  label: string;
  active: boolean;
}

export interface ShiftDetailsResponse {
  // This is what showshiftDetails() returns
  shiftNo: string;
  // ... all the full shift data
  [key: string]: any;
}

export interface FormValues {
  id?: number;
  shift_team_id?: number;
  shift_start?: string | null;
  shift_end?: string | null;
  submit_type?: 'pending' | 'close' | 'suspend';
  isOpenSwitchON?: boolean;
  isCloseSwitchON?: boolean;
  fuel_vouchers?: any[];
  adjustments?: any[];
  pump_readings?: Record<number, any> | any[];
  product_prices?: Record<number, any> | any[];
  main_ledger_id?: number | null;
  main_ledger_amount?: number | null;
  other_ledgers?: any[];
  dipping_before?: any[];
  dipping_after?: any[];
}

export type SalesShiftFormValues = {
  id?: number;
  shift_team_id?: number;
  shift_start?: string | null;
  shift_end?: string | null;
  submit_type?: 'pending' | 'close' | 'suspend';
  main_ledger_id?: number | null;
  main_ledger_amount?: number | null;
  pump_readings?: Record<number, any> | PumpReading[];
  product_prices?: Record<number, any> | FuelPrice[];
  fuel_vouchers?: FuelVoucher[];
  adjustments?: Adjustment[];
  other_ledgers?: LedgerEntry[];
  dipping_before?: any[];
  dipping_after?: any[];
  isOpenSwitchON?: boolean;
  isCloseSwitchON?: boolean;
};

export interface FuelPrice {
  product_id: number;
  price: number;
}

export interface LedgerEntry {
  id: number;
  name: string;
  amount: number;
}

export interface Dipping {
  readings: Array<{
    id?: number;
    tank_id?: number;
    product_id?: number;
    readings: string | number;
  }>;
}

export interface DippingReading {
  tank: { name: string };
  product_id: number;
  reading: number;
  deviation: number;
}

export interface Station {
  id: number;
  fuel_pumps: Array<{ id: number; name: string; product_id: number }>;
  tanks: Array<{ id: number; name: string; product_id: number }>;
  products: Array<{ id: number; name: string }>;
  shift_teams: Array<{
    id: number;
    name: string;
    ledgers: Array<{ id: number; name: string }>;
  }>;
}

export interface StationContextType {
  activeStation?: Station | null;
}

export interface LedgerAccount {
  id: number;
  name: string;
  amount: number;
}

export interface SalesShiftData {
  id: number;
  shiftNo: string;
  shift_start: string;
  shift_end: string | null;
  shift_team_id: number;
  creator?: User | null;
  main_ledger?: LedgerAccount | null;
  other_ledgers: LedgerAccount[];
  fuel_prices: FuelPrice[];
  pump_readings: PumpReading[];
  opening_dipping?: { readings: DippingReading[] } | null;
  closing_dipping?: { readings: DippingReading[] } | null;
  fuel_vouchers: FuelVoucher[];
  adjustments: Adjustment[];
}

export const StationFormContext = createContext<{ activeStation?: any }>({});