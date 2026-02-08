import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();

  const res = await fetch(`${API_BASE}/requisitions?${queryString}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}