import { getAuthHeaders, handleJsonResponse } from '@/lib/utils/apiUtils';
import { NextRequest } from 'next/server';

const API_BASE = process.env.API_BASE_URL!;

export async function GET(request: NextRequest) {
  const { headers, response } = await getAuthHeaders(request);
  if (response) return response;
  const url = new URL(request.url);

  // Extract ID from the pathname
  const pathnameParts = url.pathname.split('/');
  const id = pathnameParts[pathnameParts.length - 2];

  const res = await fetch(`${API_BASE}/fuel-stations/dippings/${id}`, {
    headers,
    credentials: 'include',
  });

  return handleJsonResponse(res);
}