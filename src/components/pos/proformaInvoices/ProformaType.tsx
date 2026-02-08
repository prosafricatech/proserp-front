import { Currency } from "@/components/masters/Currencies/CurrencyType";
import { Stakeholder } from "@/components/masters/stakeholders/StakeholderType";

interface Creator {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface ProformaItem {
  id?: number;
  product_id: number;
  product?: {
    id: number;
    type?: string;
    vat_exempted?: boolean;
  };
  product_type?: string;
  quantity: number;
  measurement_unit_id?: number;
  measurement_unit?: {
    id: number;
    name: string;
  };
  rate: number;
  store_id?: number;
}

export interface Proforma {
  id?: number;
  proformaNo?: string;
  proforma_date: string;
  expiry_date?: string | null;
  amount?: number;
  vat_amount?: number;
  vat_percentage?: number;
  remarks?: string | null;
  currency_id?: number;
  currency: Currency;
  exchange_rate?: number;
  creator?: Creator;
  stakeholder?: Stakeholder;
  items?: ProformaItem[];
  vat_registered?: boolean;
  reference?: string;
  sales_outlet_id?: number;
}