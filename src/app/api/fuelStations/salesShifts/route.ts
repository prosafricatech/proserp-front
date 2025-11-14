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
<<<<<<< HEAD
  const stationId = searchParams.get('stationId') || '';
  
  const queryParams = new URLSearchParams({
    keyword,
    page,
    limit,
    ...(stationId && { stationId })
  }).toString();

  const res = await fetch(`${API_BASE}/fuel-stations/${stationId}/sales-shifts?${queryParams}`, {
=======
  const stationId = searchParams.get('stationId') || ''; // HII NDIO ULIKUWA NAYO SAWA!

  if (!stationId) {
    return new Response(
      JSON.stringify({ error: 'stationId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Tumia stationId moja kwa moja (sio kutoka queryParams string)
  const res = await fetch(`${API_BASE}/fuel-stations/${stationId}/sales-shifts`, {
>>>>>>> 029f1171b30a81be30531107a51da2d7a38b7e5f
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}