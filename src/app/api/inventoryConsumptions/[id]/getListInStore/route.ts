import { NextRequest } from 'next/server';
import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const queryString = searchParams.toString();

  const pathnameParts = url.pathname.split('/');
  const idIndex = pathnameParts.indexOf('inventory-consumptions') - 1;
  const id = pathnameParts[idIndex];

  const res = await fetch(`${API_BASE}/stores/${id}/inventory-consumptions?${queryString}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}