import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId') || '';
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';

  const queryParams = new URLSearchParams({
    keyword,
    page,
    limit,
  }).toString();

  const res = await fetch(`${API_BASE}/fuel-stations/${stationId}/dippings?${queryParams}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}