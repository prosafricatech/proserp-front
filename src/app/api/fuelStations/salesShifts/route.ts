import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  const stationId = searchParams.get('stationId') || '';
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    keyword,
    page,
    limit,
    ...(stationId && { stationId }) // Only include stationId if it exists
  }).toString();

  // Fixed URL - using the stationId from searchParams
  const res = await fetch(`${API_BASE}/fuel-stations/${queryParams.stationId}/sales-shifts`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}