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
<<<<<<< HEAD
  
=======

>>>>>>> 0705573ef28edb3f8faea44f75035c041c048907
  if (!stationId) {
    return new Response(
      JSON.stringify({ error: 'stationId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const queryParams = new URLSearchParams();
  queryParams.append('page', page);
  queryParams.append('limit', limit);
  
  if (keyword) {
    queryParams.append('keyword', keyword);
  }


  const apiUrl = `${API_BASE}/fuel-stations/${stationId}/sales-shifts?${queryParams.toString()}`;

  const res = await fetch(apiUrl, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}