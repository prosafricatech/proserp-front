import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // MOCK DATA for dashboard figures (replace with real API call as needed)
  return new Response(
    JSON.stringify({
      contract_sum: 17363897161.04,
      certified_revenue: 0,
      progressive_revenue: 4890234121.86747,
      cost_to_date: 660407400,
      budget: 12603754408.54,
      remaining_budget: 11943347008.54,
      gross_profit_to_date: 4229826721.86747,
      time_progress: 45.05,
      physical_progress: 34.64
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}