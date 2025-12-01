import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  // Declare searchParams FIRST before using it
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get('stationId') || '';
  const keyword = searchParams.get('keyword') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '10';
  

  if (!stationId) {
    return new Response(
      JSON.stringify({ error: 'stationId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Build query parameters including all necessary params
  const queryParams = new URLSearchParams({
    keyword,
    page,
    limit,
  }).toString();

  const res = await fetch(`${API_BASE}/fuel-stations/${stationId}/sales-shifts?${queryParams}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}