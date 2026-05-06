import axios from '@/lib/services/config';

interface ReportParams {
  from: string;
  to: string;
  work_center_id?: string;
  cost_center_id?: string;
  product_id?: string;
}

interface OutputReportResponse {
  summary: {
    total_batches: number;
    total_output_value: number;
    total_by_product_value: number;
    products: Array<{
      product: { id: string; name: string };
      measurement_unit: { id: string; symbol: string; name: string };
      total_quantity: number;
      average_unit_cost: number;
      total_value: number;
      batch_count: number;
    }>;
  };
  batches: Array<{
    id: string;
    batchNo: string;
    start_date: string;
    end_date: string;
    work_center: {
      id: string;
      name: string;
      cost_center: { id: string; name: string };
    };
    total_output_value: number;
    total_by_product_value: number;
    outputs: Array<{
      id: string;
      product: { id: string; name: string };
      measurement_unit: { id: string; symbol: string };
      quantity: number;
      unit_cost: number;
      total_value: number;
      value_percentage: number;
    }>;
    by_products: Array<{
      id: string;
      product: { id: string; name: string };
      measurement_unit: { id: string; symbol: string };
      quantity: number;
      market_value_per_unit: number;
      total_market_value: number;
    }>;
  }>;
  period: {
    from: string;
    to: string;
  };
}

interface CostReportResponse {
  summary: {
    total_batches: number;
    total_material_cost: number;
    total_ledger_expense_cost: number;
    total_by_product_offset: number;
    net_production_cost: number;
  };
  material_consumptions: Array<{
    product: { id: string; name: string };
    measurement_unit: { id: string; symbol: string };
    total_quantity: number;
    average_unit_cost: number;
    total_cost: number;
    batches: Array<{
      batchNo: string;
      batch_id: string;
      end_date: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
    }>;
  }>;
  ledger_expenses: Array<{
    ledger: { id: string; name: string };
    currency: { id: string; name: string };
    total_amount: number;
    batches: Array<{
      batchNo: string;
      batch_id: string;
      end_date: string;
      quantity: number;
      rate: number;
      exchange_rate: number;
      total: number;
      remarks: string;
    }>;
  }>;
  by_products: Array<{
    product: { id: string; name: string };
    measurement_unit: { id: string; symbol: string };
    total_quantity: number;
    total_market_value: number;
  }>;
  period: {
    from: string;
    to: string;
  };
}

const productionReportsServices = {
  getOutputReport: async (
    params: ReportParams
  ): Promise<OutputReportResponse> => {
    const { data } = await axios.get(
      '/api/manufacturing/batches/productionOutputReport',
      {
        params,
      }
    );
    return data;
  },

  getCostReport: async (params: ReportParams): Promise<CostReportResponse> => {
    const { data } = await axios.get(
      '/api/manufacturing/batches/productionCostReport',
      {
        params,
      }
    );
    return data;
  },

  ExportProductionOutputReportToExcel: async (params: any) => {
    const { data } = await axios.post(
      `/api/exports/excel/ProductionOutputReport/`,
      params,
      {
        responseType: 'blob',
      }
    );
    return data;
  },
};

export type { CostReportResponse, OutputReportResponse, ReportParams };
export default productionReportsServices;
