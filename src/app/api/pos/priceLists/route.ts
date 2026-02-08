import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const fuelPriceLists = searchParams.get('fuelPriceLists') === 'true';

  const queryString = searchParams.toString();

  const res = await (fuelPriceLists
    ? fetch(`${API_BASE}/fuel-stations/fuel-pricelists?${queryString}`, {
        headers,
        credentials: 'include',
      })
    : fetch(`${API_BASE}/price_list?${queryString}`, {
        headers,
        credentials: 'include',
      })
  );

  return handleJsonResponse(res);
}
