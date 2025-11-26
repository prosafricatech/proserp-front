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
=======
  const stationId = searchParams.get('stationId') || ''; 
>>>>>>> 120122672610cd4a26397d74042f4b6474593ff6

  if (!stationId) {
    return new Response(
      JSON.stringify({ error: 'stationId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const res = await fetch(`${API_BASE}/fuel-stations/${stationId}/sales-shifts`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}