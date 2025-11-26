import { Ledger } from '@/components/accounts/ledgers/LedgerType';
import { Product } from '@/components/productAndServices/products/ProductType';
import { Stakeholder } from '@/components/masters/stakeholders/StakeholderType';
import { FuelPump, Station } from '../Stations/StationType';
import { User } from '@/types/auth-types';


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
  station_id?: number;
  station?: Station;
  shift_start: string;
  shift_end?: string | null;
  submit_type: 'open' | 'close' | 'draft';
  product_prices: ProductPrice[];
  pump_readings: PumpReading[];
  fuel_vouchers: FuelVoucher[];
  main_ledger: LedgerAmount;
  other_ledgers: LedgerAmount[];
  created_at?: string;
  updated_at?: string;
  users: User[];
  adjustments?: Adjustments[];
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
  fuelVoucherData?: FuelVoucherData | null | undefined;
}

export interface LedgerAmount {
  id: number;
  amount: number;
  ledger?: Ledger;
}

export interface SalesShift {
  id?: number;
  shift_team_id: number;
  shift_team?: ShiftTeam;
  station_id?: number;
  station?: Station;
  shift_start: string;
  shift_end?: string | null;
  submit_type: 'open' | 'close' | 'draft';
  product_prices: ProductPrice[];
  pump_readings: PumpReading[];
  fuel_vouchers: FuelVoucher[];
  main_ledger: LedgerAmount;
  other_ledgers: LedgerAmount[];
  created_at?: string;
  updated_at?: string;
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