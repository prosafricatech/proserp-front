export interface RFQItem {
  id?: number;
  product_id?: number;
  unit_symbol?: string;
  product?: {
    id: number;
    name?: string;
    item_name?: string;
    measurement_unit_id?: number;
    primary_unit?: {
      id: number;
      name?: string;
      unit_symbol?: string;
    };
    measurement_unit?: {
      id: number;
      name?: string;
      symbol?: string;
      unit_symbol?: string;
    };
    secondary_units?: Array<{
      id: number;
      name?: string;
      unit_symbol?: string;
    }>;
  };
  measurement_unit_id?: number;
  measurement_unit?: {
    id: number;
    name?: string;
    symbol?: string;
  };
  quantity?: number;
  remarks?: string;
}

export interface RFQStakeholder {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  tin?: string | null;
  vrn?: string | null;
  address?: string | null;
  status?: 'pending' | 'responded' | string;
  sent_at?: string | null;
}

export interface RFQResponseItem {
  id?: number;
  rfq_item_id: number;
  quantity: number;
  rate: number;
  vat_percentage?: number;
  delivery_date?: string | null;
  remarks?: string;
}

export interface RFQResponse {
  id?: number;
  stakeholder_id: number;
  stakeholder?: RFQStakeholder;
  currency_id: number;
  currency?: {
    id: number;
    name: string;
    code: string;
    symbol: string;
  };
  exchange_rate: number;
  response_date: string;
  validity_date: string;
  remarks?: string;
  has_purchase_orders?: boolean;
  items: RFQResponseItem[];
}

export interface RFQQuote {
  id: number;
  stakeholder: {
    id: number;
    name: string;
  };
  quantity: number;
  rate: number;
  vat_percentage?: number;
  delivery_date?: string | null;
  amount: number;
  awarded_quantity: number;
  unawarded_quantity: number;
}

export interface RFQComparisonItem {
  id: number;
  product: {
    id: number;
    item_name?: string;
    name?: string;
  };
  measurement_unit?: {
    id: number;
    name?: string;
    symbol?: string;
  };
  quantity: number;
  quotes: RFQQuote[];
}

export interface RFQ {
  id?: number;
  rfqNo?: string;
  rfq_date: string;
  response_deadline: string;
  reference?: string;
  remarks?: string;
  status?: string;
  requisition_approval_id?: number | null;
  requisition_approval?: any;
  creator?: { id: number; name: string };
  items: RFQItem[];
  stakeholders?: RFQStakeholder[];
  stakeholders_count?: number;
  responses_count?: number;
  items_count?: number;
  responses?: RFQResponse[];
}

export interface RFQListRow extends RFQ {
  creator?: { id: number; name: string; email?: string; phone?: string };
}

export interface RFQComparison {
  id: number;
  rfqNo?: string;
  items: RFQComparisonItem[];
}

export const STATUS_OPTIONS = [
  { lable: 'All', value: '' },
  { lable: 'Draft', value: 'draft' },
  { lable: 'Sent', value: 'sent' },
  { lable: 'Closed', value: 'closed' },
  { lable: 'Canceled', value: 'canceled' },
];
